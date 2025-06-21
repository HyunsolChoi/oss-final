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
    const [gptAnswer, setGptAnswer] = useState<String>('');
    const [jobInfo, setJobInfo] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const { jobId } = useParams<{ jobId: string }>();
    const [uId, setUId] = useState('');
    const [starred, setStarred] = useState(false);

    const navigate = useNavigate();

    const toggleBookmarkHandler = async () => {
        if (!jobInfo) return;

        try {
            await toggleBookmark(uId, Number(jobId));
        } catch (error) {
            console.error('즐겨찾기 토글 중 오류:', error);
        }
    };

    // todo: 지피티 답변 정보 저장 기능 구현하기
    const handleRetry = async () => {
        if (!jobInfo || !uId) return;

        try {
            setLoading(true);

            const res = await getConsulting(uId, jobInfo);
            setLoading(false);

            if (res.success && res.message) {
                setGptAnswer(res.message);
            } else {
                toast.error(res.message || '컨설팅 요청 실패');
            }
        } catch (err) {
            setLoading(false);
            console.error(err);
            toast.error('컨설팅 요청 중 오류가 발생했습니다');
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

                // todo: 기존에 컨설팅 내역이 있다면 가져오고 return

                setLoading(true);

                const res = await getConsulting(validId, job);
                setLoading(false);

                if (res.success && res.message) {
                    console.log(res.message);// 디버깅
                    setGptAnswer(JSON.stringify(res.message));
                } else {
                    toast.error(res.message || '컨설팅 요청 실패');
                }
            } catch (err) {
                console.error(err);
                toast.error('공고 정보를 불러오거나 컨설팅 요청에 실패했습니다');
            }
        })();

    }, [jobId]);

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
                                ? 'GPT 컨설팅 정보를 받아오는 중입니다...'
                                : (() => {
                                    try {
                                        if (!gptAnswer) return '컨설팅 결과 없음';

                                        const parsed = JSON.parse(gptAnswer as string);
                                        return (
                                            <>
                                                {parsed["적합성 평가"] && (
                                                    <>
                                                        <strong>적합성 평가:</strong>
                                                        <div>{parsed["적합성 평가"]}</div>
                                                        <br/>
                                                    </>
                                                )}
                                                {parsed["강점 분석"] && (
                                                    <>
                                                        <strong>강점 분석:</strong>
                                                        <div>{parsed["강점 분석"]}</div>
                                                        <br/>
                                                    </>
                                                )}
                                                {parsed["지원 전략 제안"] && (
                                                    <>
                                                        <strong>지원 전략 제안:</strong>
                                                        <div>{parsed["지원 전략 제안"]}</div>
                                                        <br/>
                                                    </>
                                                )}
                                                {parsed["보완점 제안"] && (
                                                    <>
                                                        <strong>보완점 제안:</strong>
                                                        <div>{parsed["보완점 제안"]}</div>
                                                    </>
                                                )}
                                            </>
                                        );
                                    } catch {
                                        return gptAnswer || '컨설팅 결과 없음';
                                    }
                                })()
                            }
                        </pre>
                        <div className="consulting-actions">
                            <button className="consulting-retry" onClick={handleRetry}>
                                컨설팅 갱신
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