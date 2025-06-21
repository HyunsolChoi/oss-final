import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import './Profile.css';
import {getUserProfile, updateUserProfile} from '../../api/user';
import {generateQuestions, updateQuestionsAndAnswers, generateUserKeywords} from '../../api/gpt';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';


interface Props {
    userId: string;
}

interface UserData {
    job: string;
    education: string;
    region: string;
    skills: string[];
}

const ProfileInfo: React.FC<Props> = ({ userId }) => {
    const [editMode, setEditMode] = useState(false);
    const [showNewForm, setShowNewForm] = useState(false);
    const [newFormAnimating, setNewFormAnimating] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

    //gpt질문
    const [currentQuestion, setCurrentQuestion] = useState(1);
    const [questions, setQuestions] = useState<string[]>([]);
    const [answers, setAnswers] = useState<string[]>(['', '', '', '']);
    const [isGenerating, setIsGenerating] = useState(false);

    const [userData, setUserData] = useState<UserData>({
        job: '',
        education: '',
        region: '',
        skills: [],
    });
    const [originalData, setOriginalData] = useState<UserData>({
        job: '',
        education: '',
        region: '',
        skills: [],
    });


    // 상단: 학력/지역 옵션 정의
    const educationOptions = ['중졸', '고졸', '전문학사', '학사', '석사', '박사'];
    const regionOptions = [
        '서울특별시', '부산광역시', '대구광역시', '인천광역시', '광주광역시',
        '대전광역시', '울산광역시', '세종특별자치시', '경기도', '강원특별자치도',
        '충청북도', '충청남도', '전북특별자치도', '전라남도', '경상북도', '경상남도', '제주특별자치도'
    ];

    // 추가 및 삭제 핸들러
    const addSkillField = () => {
        if (userData.skills.length < 15) {
            setUserData({ ...userData, skills: [...userData.skills, ''] });
        }
    };

    const handleSkillChange = (index: number, value: string) => {
        const updatedSkills = [...userData.skills];
        updatedSkills[index] = value;
        setUserData({ ...userData, skills: updatedSkills });
    };

    const removeSkillField = (index: number) => {
        const updatedSkills = userData.skills.filter((_, i) => i !== index);
        setUserData({ ...userData, skills: updatedSkills });
    };


    useEffect(() => {
        if (userId === '') return;

        (async () => {
            const result = await getUserProfile(userId);
            if (!result.success) {
                toast.error(result.message || '사용자 정보를 불러오는 데 실패했습니다');
                return;
            }

            setUserData({
                job: result.sector || '',
                education: result.education || '',
                region: result.region || '',
                skills: result.skills || [],
            });

            setOriginalData({
                job: result.sector || '',
                education: result.education || '',
                region: result.region || '',
                skills: result.skills || [],
            });
        })();
    }, [userId]);

    const isValidJob = (text: string): boolean => {
        const regex = /^[a-zA-Z0-9가-힣/()&.+#]+$/;
        return regex.test(text);
    };

    const isValidSkill = (text: string): boolean => {
        const regex = /^[a-zA-Z0-9가-힣().+]+$/;
        return regex.test(text);
    };

    const generateGptQuestion = async () => {
        if (isGenerating) return;

        const job = userData.job.trim();
        const validSkills = userData.skills.map((sk) => sk.trim()).filter((sk) => sk !== '');

        if (job === '' || userData.education.trim() === '' || userData.region.trim() === '') {
            toast.error('모든 필드를 입력해주세요');
            return;
        }
        if (job.length > 15) {
            toast.error('직무는 15글자 이하로 입력해주세요');
            return;
        }

        if (!isValidJob(userData.job)) {
            toast.error("직무는 한글, 영어, 숫자, / ( ) & . + # 만 입력 가능합니다");
            return;
        }

        if (validSkills.length === 0) {
            toast.error('기술은 최소 1개 이상 입력해야 합니다');
            return;
        }

        for (const sk of validSkills) {
            if (sk.length > 20) {
                toast.error(`기술 '${sk}'은 20글자 이하로 입력해주세요`);
                return;
            }

            if (!isValidSkill(sk)) {
                toast.error(`기술 '${sk}'은 허용되지 않는 문자를 포함하고 있습니다`);
                return;
            }
        }

        try {
            setIsGenerating(true);

            const gpt = await generateQuestions({
                job: job,
                skills: validSkills,
                education: userData.education,
                region: userData.region
            });

            if (gpt.success && gpt.questions) {
                setQuestions(gpt.questions);
                setAnswers(new Array(gpt.questions.length).fill(''));
            } else {
                toast.error(gpt.message || '질문 생성에 실패했습니다');
            }

            // 애니메이션 시작
            setIsTransitioning(true);
            setShowNewForm(true);

            // 다음 프레임에서 애니메이션 트리거
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setNewFormAnimating(true);
                    setEditMode(false);
                });
            });

            toast.success('추가 질문에 답변해주세요!');

        } catch (err: any) {
            toast.error(err.message || '질문 생성 중 오류 발생');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAnswerChange = (value: string) => {
        const updatedAnswers = [...answers];
        updatedAnswers[currentQuestion - 1] = value;
        setAnswers(updatedAnswers);
    };

    const handleNextQuestion = async () => {
        if (!answers[currentQuestion - 1].trim()) {
            toast.error('답변을 입력해주세요');
            return;
        }

        if (currentQuestion < questions.length) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            toast.success('모든 질문에 답변해주셔서 감사합니다!');

            const job = userData.job.trim();
            const validSkills = userData.skills.map((sk) => sk.trim()).filter((sk) => sk !== '');

            // gpt질문들 DB 저장
            let result = await updateQuestionsAndAnswers({userId, questions, answers});

            if (!result.success) {
                toast.error(result.message || '질문 저장 실패');
                return;
            }

            // 키워드 갱신
            result = await generateUserKeywords(userId);

            if (!result.success) {
                toast.error(result.message || '키워드 갱신 실패');
                return;
            }

            //사용자 정보 DB 저장
            result = await updateUserProfile({
                userId,
                sector: job,
                education: userData.education.trim(),
                region: userData.region.trim(),
                skills: validSkills,
            });

            if (!result.success) {
                toast.error(result.message || '정보 저장 실패');
                return;
            }

            // 애니메이션과 함께 원래 상태로 복귀
            setNewFormAnimating(false);
            setTimeout(() => {
                setShowNewForm(false);
                setIsTransitioning(false);
                setCurrentQuestion(1);
                setAnswers(['', '', '','']);
            }, 400);
        }
    };

    const handlePreviousQuestion = () => {
        if (currentQuestion > 1) {
            setCurrentQuestion(currentQuestion - 1);
        } else {
            // 애니메이션 시작
            setNewFormAnimating(false);
            setIsTransitioning(false);

            // 애니메이션 완료 후 상태 초기화
            setTimeout(() => {
                setShowNewForm(false);
                setEditMode(true);
                setCurrentQuestion(1);
                setAnswers(['', '', '','']);
            }, 400); // CSS transition 시간과 동일
        }
    };

    // 새 정보 입력 폼 (슬라이드 인 되는 폼)
    const renderNewInfoForm = () => (
        <div className={`new-info-form ${newFormAnimating ? 'slide-in' : ''}`}>
            <div className="new-form-wrapper">
                <h2>추가 질문 ({currentQuestion}/{questions.length})</h2>

                <div className="question-progress">
                    <div
                        className="progress-bar"
                        style={{width: `${(currentQuestion / questions.length) * 100}%`}}
                    />
                </div>

                <form className="info-form">
                    <div className="question-content">
                        <h3>{questions[currentQuestion - 1]}</h3>
                        <textarea
                            rows={6}
                            value={answers[currentQuestion - 1]}
                            onChange={(e) => handleAnswerChange(e.target.value)}
                            className="question-textarea"
                        />
                    </div>

                    {/* 액션 버튼 */}
                    <div className="info-action-wrapper">
                        <div className="info-action-top">
                            <button
                                type="button"
                                className="edit-button cancel"
                                onClick={handlePreviousQuestion}
                            >
                                이전
                            </button>
                            <button
                                type="button"
                                className="edit-button"
                                onClick={handleNextQuestion}
                            >
                                {currentQuestion === questions.length ? '완료' : '다음'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );

    return (
        <div className="profile-content">
            <h2>내 정보</h2>
            <div className="form-container">
                <form className={`info-form ${isTransitioning ? 'slide-out' : ''}`}>
                    {/* 직무 */}
                    <label>
                        직무
                        <input
                            type="text"
                            value={userData.job}
                            readOnly={!editMode}
                            onChange={(e) => setUserData({...userData, job: e.target.value})}
                            className={!editMode ? 'read-only' : ''}
                        />
                    </label>

                    {/* 학력 */}
                    <label>
                        학력
                        <select
                            value={userData.education}
                            disabled={!editMode}
                            onChange={(e) => setUserData({...userData, education: e.target.value})}
                        >
                            <option value="">학력 선택</option>
                            {educationOptions.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </label>

                    {/* 지역 */}
                    <label>
                        근무 희망 지역
                        <select
                            value={userData.region}
                            disabled={!editMode}
                            onChange={(e) => setUserData({...userData, region: e.target.value})}
                        >
                            <option value="">지역 선택</option>
                            {regionOptions.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </label>

                    {/* 기술 */}
                    <label>
                        기술 (최소 1개)
                        {userData.skills.map((skill, idx) => (
                            <div className="info-input-group" key={idx}>
                                <input
                                    type="text"
                                    value={skill}
                                    readOnly={!editMode}
                                    onChange={(e) => handleSkillChange(idx, e.target.value)}
                                    className={!editMode ? 'read-only' : ''}
                                />
                                {editMode && (
                                    <span className="info-show-toggle" onClick={() => removeSkillField(idx)}>
                                        삭제
                                    </span>
                                )}
                            </div>
                        ))}
                    </label>

                    {/* 수정 버튼 항상 표시 */}
                    <div className="info-action-wrapper">
                        {editMode && (
                            <div className="info-action-top">
                                <button
                                    type="button"
                                    className="info-add-skill-btn"
                                    onClick={addSkillField}
                                    disabled={userData.skills.length >= 15}
                                >
                                    + 기술 추가 ({userData.skills.length}/15)
                                </button>

                                <button
                                    type="button"
                                    className="edit-button cancel"
                                    onClick={() => {
                                        setUserData(originalData);
                                        setEditMode(false);
                                    }}
                                >
                                    취소
                                </button>
                            </div>
                        )}

                        {!editMode && (
                            <div className="info-action-top">
                                <div style={{flex: 1}}></div>
                                <button
                                    type="button"
                                    className="edit-button"
                                    onClick={() => setEditMode(true)}
                                >
                                    수정
                                </button>
                            </div>
                        )}

                        {editMode && (
                            <button
                                type="button"
                                className={`edit-button full-width${isGenerating ? ' loading' : ''}`}
                                onClick={generateGptQuestion}
                                disabled={isGenerating}
                            >
                                {isGenerating ? (
                                    <>
                                        <FontAwesomeIcon icon={faSpinner} spin style={{ marginRight: '8px' }} />
                                        질문 생성 중...
                                    </>
                                ) : (
                                    '다음'
                                )}
                            </button>
                        )}
                    </div>
                </form>

                {showNewForm && renderNewInfoForm()}
            </div>
        </div>
    );
};

export default ProfileInfo;