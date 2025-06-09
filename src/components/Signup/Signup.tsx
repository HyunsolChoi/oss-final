import React, {useEffect, useState} from 'react';
import './Signup.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock, faBriefcase, faLightbulb, faPaperPlane, faQuestionCircle  } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { checkDuplicateId, signup } from '../../api/auth';
import { generateQuestions } from '../../api/gpt';
import {useNavigate} from "react-router-dom";

interface Props {
    email: string;
}

const Signup: React.FC<Props> = ({ email }) => {
    // 1. 페이지 단계 관리 (1~3단계)
    const [pageStep, setPageStep] = useState<number>(1);

    // 2. 1단계 상태 (아이디/비밀번호)
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');

    // 3. 2단계 상태 (학력/지역/직무/기술)
    const [education, setEducation] = useState('');
    const [region, setRegion] = useState('');
    const [job, setJob] = useState('');
    const [skills, setSkills] = useState<string[]>(['']);
    const [trimmedSkills, setTrimmedSkills] = useState<string[]>([]);

    // 4. 3단계 상태 (질문 4개 + 각 질문별 답변)
    const [questions, setQuestions] = useState<string[]>([]);
    const [answers, setAnswers] = useState<string[]>(['', '', '', '']);
    const [loadingQuestions, setLoadingQuestions] = useState(false);

    const navigate = useNavigate();

    const addSkillField = () => {
        if (skills.length < 15) {
            setSkills([...skills, '']);
        }
    };

    const handleSkillChange = (index: number, value: string) => {
        const newSkills = [...skills];
        newSkills[index] = value;
        setSkills(newSkills);
    };

    const removeSkillField = (index: number) => {
        setSkills(skills.filter((_, i) => i !== index));
    };

    const isValidUserId = (id: string): boolean => {
        const regex = /^[a-zA-Z0-9]{6,20}$/;
        return regex.test(id);
    };

    const isValidPwd = (pwd: string): boolean => {
        const regex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@])[a-zA-Z\d!@]{8,15}$/;
        return regex.test(pwd);
    };

    const isValidJob = (text: string): boolean => {
        const regex = /^[a-zA-Z0-9가-힣/()&.+#]+$/;
        return regex.test(text);
    };

    const isValidSkill = (text: string): boolean => {
        const regex = /^[a-zA-Z0-9가-힣().+]+$/;
        return regex.test(text);
    };

    const hasDuplicateSkills = (skills: string[]): boolean => {
        const trimmed = skills.map(s => s.trim()).filter(s => s !== '');
        const unique = new Set(trimmed);
        return unique.size !== trimmed.length;
    };

    const signupComplete = async () => {
        // 모든 답변이 입력되었는지 확인
        const filledAnswers = answers.filter(a => a.trim() !== '');
        if (filledAnswers.length !== questions.length) {
            toast.error('모든 질문에 답변해주세요');
            return;
        }

        try {
            const result = await signup({
                userId,
                email,
                password,
                sector: job,
                education,
                region,
                skills: trimmedSkills,
                questions,
                answers
            });

            if (result.success) {
                toast.success("회원가입 성공!");
                navigate("/signin");
            } else {
                toast.error(result.message || "회원가입에 실패했습니다");
            }
        } catch (err: any) {
            toast.error(err.message || "회원가입 중 오류 발생");
        }
    };

    const checkValidUserKeyword = async () => {
        if (!job.trim()) {
            toast.error("직무를 입력해주세요");
            return;
        }

        if (job.trim().length > 15) {
            toast.error("직무는 15글자 이하로 입력해주세요");
            return;
        }

        if (!isValidJob(job)) {
            toast.error("직무는 한글, 영어, 숫자, / ( ) & . + # 만 입력 가능합니다");
            return;
        }

        const trimmed = skills.map(s => s.trim()).filter(s => s !== '');
        setTrimmedSkills(trimmed);

        if (trimmed.length === 0) {
            toast.error("하나 이상의 기술을 입력해주세요");
            return;
        }

        if (hasDuplicateSkills(skills)) {
            toast.error("기술 항목에 중복된 값이 있습니다");
            return;
        }

        for (const skill of trimmed) {
            if (skill.length > 20) {
                toast.error(`기술 '${skill}'은 20글자 이하로 입력해주세요`);
                return;
            }

            if (!isValidSkill(skill)) {
                toast.error(`기술 '${skill}'은 허용되지 않는 문자를 포함하고 있습니다`);
                return;
            }
        }

        // GPT 질문 생성
        setLoadingQuestions(true);
        try {
            const result = await generateQuestions({
                job: job.trim(),
                skills: trimmed,
                education,
                region
            });

            if (result.success && result.questions) {
                setQuestions(result.questions);
                setAnswers(new Array(result.questions.length).fill(''));
                setPageStep(3);
            } else {
                toast.error(result.message || '질문 생성에 실패했습니다');
            }
        } catch (error) {
            toast.error('질문 생성 중 오류가 발생했습니다');
        } finally {
            setLoadingQuestions(false);
        }
    };

    const checkValidIdPwd = async () => {
        if (!userId || !password || !confirmPassword) {
            toast.error("모든 항목을 입력해주세요");
            return;
        }
        if (!isValidUserId(userId)) {
            toast.error("아이디는 영문자 및 숫자 6~20자여야 합니다");
            return;
        }
        if (!isValidPwd(password)) {
            toast.error("비밀번호는 영문자, 숫자 및 특수문자(!, @) 8~15자여야 합니다");
            return;
        }
        if (password !== confirmPassword) {
            toast.error("비밀번호가 일치하지 않습니다");
            return;
        }
        if (userId === password) {
            toast.error("아이디와 비밀번호는 같을 수 없습니다");
            return;
        }

        try {
            const isAvailable = await checkDuplicateId(userId);
            if (!isAvailable) {
                toast.error("이미 존재하는 아이디입니다");
                return;
            }
        } catch (err: any) {
            toast.error(err.message || "아이디 중복 확인 중 오류 발생");
            return;
        }

        setPageStep(2);
    };

    useEffect(() => {
        const cookies = document.cookie
            .split(';')
            .map(cookie => cookie.trim());

        const hasAgreement = cookies.some(cookie =>
            cookie.startsWith('careerfit_agreementAccepted=')
        );
        const hasEmailVerified = cookies.some(cookie =>
            cookie.startsWith('careerfit_emailVerified=')
        );

        if (!hasAgreement || !hasEmailVerified) {
            toast.error("세션이 만료되어 동의 페이지로 이동합니다");
            navigate('/agreement');
        }
    }, [navigate]);

    return (
        <div className="signup-wrapper">
            <h2>회원가입</h2>

            {/*─────────── 1단계: 아이디/비밀번호 입력 ───────────*/}
            {pageStep === 1 && (
                <>
                    <div className="input-group">
                        <FontAwesomeIcon icon={faUser} className="input-icon"/>
                        <input
                            type="text"
                            placeholder="아이디(숫자,영어)"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                        />
                    </div>

                    <div className="input-group">
                        <FontAwesomeIcon icon={faLock} className="input-icon"/>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="비밀번호"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <span
                            className="show-toggle"
                            onClick={() => setShowPassword(!showPassword)}>
                            비밀번호 표시
                        </span>
                    </div>

                    <div className="input-group">
                        <FontAwesomeIcon icon={faLock} className="input-icon"/>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="비밀번호 확인"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    <button
                        className="signup-button"
                        onClick={async () => {
                            await checkValidIdPwd();
                        }}
                    >
                        다음
                    </button>
                </>
            )}

            {/*─────────── 2단계: 학력/지역/직무/기술 입력 ───────────*/}
            {pageStep === 2 && !loadingQuestions && (
                <>
                    <div className="input-description">
                        최종 학력을 선택해주세요
                    </div>
                    <div className="input-group">
                        <select
                            value={education}
                            onChange={(e) => setEducation(e.target.value)}
                        >
                            <option value="">학력 선택</option>
                            <option value="중졸">중학교 졸업</option>
                            <option value="고졸">고등학교 졸업</option>
                            <option value="전문학사">전문학사 (2~3년제)</option>
                            <option value="학사">학사</option>
                            <option value="석사">석사</option>
                            <option value="박사">박사</option>
                        </select>
                    </div>

                    <div className="input-description">
                        근로 희망 지역을 선택해주세요
                    </div>
                    <div className="input-group">
                        <select
                            value={region}
                            onChange={(e) => setRegion(e.target.value)}
                        >
                            <option value="">지역 선택</option>
                            <option value="서울특별시">서울특별시</option>
                            <option value="부산광역시">부산광역시</option>
                            <option value="대구광역시">대구광역시</option>
                            <option value="인천광역시">인천광역시</option>
                            <option value="광주광역시">광주광역시</option>
                            <option value="대전광역시">대전광역시</option>
                            <option value="울산광역시">울산광역시</option>
                            <option value="세종특별자치시">세종특별자치시</option>
                            <option value="경기도">경기도</option>
                            <option value="강원특별자치도">강원특별자치도</option>
                            <option value="충청북도">충청북도</option>
                            <option value="충청남도">충청남도</option>
                            <option value="전북특별자치도">전북특별자치도</option>
                            <option value="전라남도">전라남도</option>
                            <option value="경상북도">경상북도</option>
                            <option value="경상남도">경상남도</option>
                            <option value="제주특별자치도">제주특별자치도</option>
                        </select>
                    </div>

                    <div className="input-description">
                        <span className="pointer">*</span> 예: 백엔드, 재무회계, 세무사 등 (개발자, 담당자 등의 키워드 제외)
                    </div>
                    <div className="input-group">
                        <FontAwesomeIcon icon={faBriefcase} className="input-icon"/>
                        <input
                            type="text"
                            placeholder="희망 직무"
                            value={job}
                            onChange={(e) => setJob(e.target.value)}
                        />
                    </div>

                    <div className="input-description">
                        <span className="pointer">*</span> 한 개 이상의 기술(자격증 포함)을 입력하세요 (중복 제외)
                    </div>
                    {skills.map((skill, idx) => (
                        <div className="input-group" key={idx}>
                            <FontAwesomeIcon icon={faLightbulb} className="input-icon"/>
                            <input
                                type="text"
                                placeholder={`기술 - ${idx + 1}`}
                                value={skill}
                                onChange={(e) => handleSkillChange(idx, e.target.value)}
                            />
                            {idx > 0 && (
                                <span
                                    className="show-toggle"
                                    onClick={() => removeSkillField(idx)}
                                >
                                    삭제
                                </span>
                            )}
                        </div>
                    ))}

                    {skills.length < 15 && (
                        <button type="button" className="add-skill-button" onClick={addSkillField}>
                            + 기술 추가 ({skills.length}/15)
                        </button>
                    )}

                    <div style={{display: 'flex', justifyContent: 'space-between', gap: '10px'}}>
                        <button
                            className="signup-button"
                            style={{flex: 1}}
                            onClick={() => setPageStep(1)} // 이전 단계로 전환
                        >
                            이전
                        </button>

                        <button
                            className="signup-button"
                            style={{flex: 1}}
                            onClick={async () => {
                                if (!job || skills.filter(s => s.trim() !== '').length === 0 || !education || !region) {
                                    toast.error("모든 항목을 입력해주세요.");
                                    return;
                                }
                                await checkValidUserKeyword();
                            }}
                            disabled={loadingQuestions}
                        >
                            {loadingQuestions ? '질문 생성 중...' : '다음'}
                        </button>
                    </div>
                </>
            )}

            {/* 로딩 화면 */}
            {loadingQuestions && (
                <div className="loading-screen">
                    <FontAwesomeIcon
                        icon={faQuestionCircle}
                        size="3x"
                        style={{
                            color: '#6366f1',
                            animation: 'spin 2s linear infinite'
                        }}
                    />
                    <p>잠시만 기다려주세요... 질문을 생성 중입니다.</p>
                </div>
            )}

            {/*─────────── 3단계: 질문 생성 & 답변 입력 ───────────*/}
            {pageStep === 3 && !loadingQuestions && (
                <>
                    <div>
                        <div className="input-description">
                            <FontAwesomeIcon icon={faQuestionCircle} className="input-icon" />
                            아래 질문에 대해 답변해 주세요
                        </div>

                        {questions.map((question, idx) => (
                            <div key={idx} style={{ marginBottom: '20px' }}>
                                <label className="question-label" style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontWeight: 'bold',
                                    color: '#333'
                                }}>
                                    {idx + 1}. {question}
                                </label>
                                <div className="input-group">
                                    <input
                                        type="text"
                                        placeholder="답변을 입력하세요"
                                        value={answers[idx] || ''}
                                        onChange={(e) => {
                                            const newAnswers = [...answers];
                                            newAnswers[idx] = e.target.value;
                                            setAnswers(newAnswers);
                                        }}
                                        style={{ paddingLeft: '12px' }}
                                    />
                                </div>
                            </div>
                        ))}

                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                            <button
                                className="signup-button"
                                style={{ flex: 1 }}
                                onClick={() => setPageStep(2)} // 이전 단계로 전환
                            >
                                이전
                            </button>
                            <button
                                className="signup-button"
                                style={{flex: 3}}
                                onClick={() => signupComplete()}
                            >
                                가입 완료
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Signup;