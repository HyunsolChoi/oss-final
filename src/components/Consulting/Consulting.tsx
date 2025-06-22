import React, { useState, useEffect } from 'react';
import {useNavigate, useParams} from "react-router-dom";
import './Consulting.css';
import {getConsulting} from '../../api/gpt';
import {toast} from "react-toastify";
import {isBookmarked, toggleBookmark} from "../../api/bookmark";
import {getJobInfo, increaseJobView, Job} from "../../api/jobs";
import Footer from "../utils/Footer/Footer";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';


interface Props {
    checkToken: () =>  string | undefined;
}

const Consulting: React.FC<Props> = ({checkToken}) => {
    const [gptAnswer, setGptAnswer] = useState<string>('');
    const [jobInfo, setJobInfo] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const { jobId } = useParams<{ jobId: string }>();
    const [uId, setUId] = useState('');
    const [starred, setStarred] = useState(false);
    const [isConsultingRetry, setIsConsultingRetry] = useState(false);
    const [retryAvailable, setRetryAvailable] = useState(true);

    const navigate = useNavigate();

    const toggleBookmarkHandler = async () => {
        if (!jobInfo) return;

        try {
            await toggleBookmark(uId, Number(jobId));
        } catch (error) {
            console.error('즐겨찾기 토글 중 오류:', error);
        }
    };

    const handleRetry = async () => {
        if (!jobInfo || !uId) return;

        if (!retryAvailable) {
            toast.error('하루에 한 번만 갱신할 수 있습니다. 내일 다시 시도해주세요.');
            return;
        }

        try {
            setLoading(true);
            setIsConsultingRetry(true);

            const res = await getConsulting(uId, jobInfo, true);

            if (res.success && res.message) {
                try {
                    // 문자열이면 후처리
                    const cleaned =
                        typeof res.message === 'string'
                            ? res.message
                                .replace(/,\s*}/g, '}')   // 마지막 객체 항목 쉼표 제거
                                .replace(/,\s*]/g, ']')   // 마지막 배열 항목 쉼표 제거
                            : res.message;

                    setGptAnswer(cleaned);
                    setRetryAvailable(false); // 갱신 후 비활성화
                } catch (err) {
                    console.error('GPT 응답 후처리 오류:', err);
                    toast.error('GPT 응답 처리 중 오류가 발생했습니다');
                }
            } else {
                if (res.message?.includes('하루에 한 번만')) {
                    setRetryAvailable(false);
                }
                toast.error(res.message || '컨설팅 갱신 실패');
            }
        } catch (err) {
            console.error(err);
            toast.error('컨설팅 갱신 중 오류가 발생했습니다');
        } finally {
            setLoading(false);
            setIsConsultingRetry(false);
        }
    };

    useEffect(() => {
        const validId = checkToken() ?? '';

        if(!validId){
            toast.error("컨설팅 서비스는 로그인 후 사용 가능합니다");
            navigate('/signin');
            return;
        }

        setUId(validId);

        if (!jobId || isNaN(Number(jobId))) {
            toast.error("유효하지 않은 경로");
            navigate('/');
            return;
        }

        (async () => {
            try {
                const job = await getJobInfo(Number(jobId));

                if (!job || !job.id || !job.title || !job.company) {
                    toast.error("유효하지 않은 공고입니다");
                    navigate('/');
                    return;
                }

                setJobInfo(job); // job 정보 상태 저장

                setStarred(await isBookmarked(validId, Number(jobId)));

                // 조회수 증가
                await increaseJobView(Number(jobId), validId);

                setLoading(true);

                const res = await getConsulting(validId, job);
                if (res.success && res.message) {
                    try {
                        // 문자열이면 후처리
                        const cleaned =
                            typeof res.message === 'string'
                                    ? res.message
                                        .replace(/,\s*}/g, '}')   // 마지막 객체 항목 쉼표 제거
                                        .replace(/,\s*]/g, ']')   // 마지막 배열 항목 쉼표 제거
                                    : res.message;

                        setGptAnswer(cleaned);

                        // retryAvailable 상태 설정
                        if (res.retryAvailable !== undefined) {
                            setRetryAvailable(res.retryAvailable);
                        }
                    } catch (err) {
                        console.error('GPT 응답 후처리 오류:', err);
                        toast.error('GPT 응답 처리 중 오류가 발생했습니다');
                    }
                } else {
                    toast.error(res.message || '컨설팅 요청 실패');
                }
                setLoading(false);

            } catch (err) {
                setLoading(false);
                console.error(err);
                toast.error('공고 정보를 불러오거나 컨설팅 요청에 실패했습니다');
            }
        })();

    }, [checkToken, jobId, navigate]);

    useEffect(() => {
        if (!gptAnswer) return;

        console.log('gptAnswer 업데이트됨:', gptAnswer); // 디버깅
    }, [gptAnswer]);

    return (
        <div className="consulting-wrapper">
            <div className="consulting-container">
                {uId !== '' && jobInfo && (
                    <div className="consulting-info-grid">
                        <div className="info-title-wrapper">
                            <div className="info-title">{jobInfo.title}</div>
                            <button
                                className="star-button"
                                onClick={async () => {
                                    setStarred(prev => !prev);
                                    await toggleBookmarkHandler();
                                }}
                            >
                                <FontAwesomeIcon icon={faStar} color={starred ? '#6366f1' : '#ccc'}/>
                            </button>
                        </div>


                        <div className="info-pair">
                            <div className="info-box"><strong>회사명</strong><span>{jobInfo.company || '미기재'}</span></div>
                            <div className="info-box"><strong>직무분야</strong><span>{jobInfo.sectors || '미기재'}</span></div>
                        </div>

                        <div className="info-grid">
                            <div className="info-box"><strong>지역</strong><span>{jobInfo.location || '미기재'}</span></div>
                            <div className="info-box"><strong>경력</strong><span>{jobInfo.experience || '미기재'}</span>
                            </div>
                            <div className="info-box"><strong>학력 조건</strong><span>{jobInfo.education || '미기재'}</span>
                            </div>
                            <div className="info-box">
                                <strong>근무형태</strong><span>{jobInfo.employmentType || '미기재'}</span></div>
                            <div className="info-box"><strong>급여</strong><span>{jobInfo.salary || '미기재'}</span></div>
                            <div className="info-box"><strong>조회수</strong><span>{jobInfo.views ?? '미기재'}</span></div>
                        </div>

                        <div className="info-footer">
                            <div className="info-deadline">기한: {jobInfo.deadline || '미기재'}</div>
                            <a href={jobInfo.link} target="_blank" rel="noopener noreferrer" className="info-link">사람인
                                바로가기</a>
                        </div>

                        <h3 className="consulting-subtitle">GPT 컨설팅 결과</h3>

                        <pre className="consulting-answer">
                          {loading
                              ? (
                                  <span>
                                    <span className="spinner"></span>GPT 컨설팅 정보를 받아오는 중입니다...
                                  </span>
                              )
                              : (() => {
                                  try {
                                      const parsed = typeof gptAnswer === 'string'
                                          ? JSON.parse(gptAnswer)
                                          : gptAnswer;

                                      let formatted = '';

                                      if (parsed["적합성 평가"]) {
                                          formatted += `적합성 평가:\n${parsed["적합성 평가"]}\n\n`;
                                      }
                                      if (parsed["강점 분석"]) {
                                          formatted += `강점 분석:\n${parsed["강점 분석"]}\n\n`;
                                      }
                                      if (parsed["지원 전략 제안"]) {
                                          formatted += `지원 전략 제안:\n${parsed["지원 전략 제안"]}\n\n`;
                                      }
                                      if (parsed["보완점 제안"]) {
                                          formatted += `보완점 제안:\n${parsed["보완점 제안"]}\n`;
                                      }

                                      return formatted.trim();
                                  } catch {
                                      return '컨설팅 결과를 처리하는 중 오류가 발생했습니다.';
                                  }
                              })()}
                        </pre>
                        <div className="consulting-actions">
                            <button
                                type = "button"
                                className={`consulting-retry ${isConsultingRetry ? ' loading' : ''} ${!retryAvailable ? ' disabled' : ''}`}
                                onClick={handleRetry}
                                disabled={isConsultingRetry || !retryAvailable}
                            >
                                {!retryAvailable ? '내일 다시 갱신 가능' : '컨설팅 갱신'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <Footer/>
        </div>
    );
};

export default Consulting;