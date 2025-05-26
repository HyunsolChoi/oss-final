import React, {useEffect, useState} from 'react';
import './Signup.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock, faBriefcase, faLightbulb  } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { checkDuplicateId, signup } from '../../api/auth'
import {useNavigate} from "react-router-dom";


interface Props {
    email: string;
}

const Signup: React.FC<Props> = ({ email }) => {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [education, setEducation] = useState('');
    const [region, setRegion] = useState('');
    const [showNext, setShowNext ] = useState(false);
    const [job, setJob] = useState('');
    const [skills, setSkills] = useState<string[]>(['']);

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
        const regex = /^[a-zA-Z0-9가-힣()]+$/;
        return regex.test(text);
    };


    const hasDuplicateSkills = (skills: string[]): boolean => {
        const trimmed = skills.map(s => s.trim()).filter(s => s !== '');
        const unique = new Set(trimmed);
        return unique.size !== trimmed.length;
    };

    const signupComplete = async () => {
        if(!isValidUserId(userId) || !isValidPwd(password) || userId===password){
            toast.error("유효하지 않은 아이디와 비밀번호 입니다")
            return;
        }

        if (!job.trim()) {
            toast.error("직무를 입력해주세요");
            return;
        }

        if (!isValidJob(job)) {
            toast.error("직무는 한글, 영어, 숫자, / ( ) & . + # 만 입력 가능합니다");
            return;
        }

        const trimmedSkills = skills.map(s => s.trim()).filter(s => s !== '');

        if (trimmedSkills.length === 0) {
            toast.error("하나 이상의 기술을 입력해주세요");
            return;
        }

        if (hasDuplicateSkills(skills)) {
            toast.error("기술 항목에 중복된 값이 있습니다");
            return;
        }

        for (const skill of trimmedSkills) {
            if (!isValidSkill(skill)) {
                toast.error(`기술 '${skill}'은 허용되지 않는 문자를 포함하고 있습니다`);
                return;
            }
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

    }

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

        setShowNext(true);
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
            // 약관 동의가 없으면 동의 페이지로
            toast.error("세션이 만료되어 동의 페이지로 이동합니다")
            navigate('/agreement');
        }

    }, [navigate]);


    return (
        <div className="signup-wrapper">
            <h2>회원가입</h2>

            {!showNext ? (
                <>
                    {/* 아이디, 비밀번호 입력 단계 */}
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
            ) : (
                <>
                    {/* 직무 및 기술 입력 단계 */}
                    <div className="input-description">
                        최종 학력을 선택해주세요
                    </div>
                    <div className="input-group">
                        <select
                            value={education}
                            onChange={(e) => setEducation(e.target.value)}
                        >
                            <option value="">학력 선택</option>
                            <option value="미입력">미입력</option>
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
                            <option value="noInput">미입력</option>
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
                            onClick={() => setShowNext(false)} // 🔙 이전 단계로 전환
                        >
                            이전
                        </button>

                        <button
                            className="signup-button"
                            style={{flex: 3}}
                            onClick={() => {
                                if (!job || skills.filter(s => s.trim() !== '').length === 0 || !education || !region) {
                                    toast.error("모든 항목을 입력해주세요.");
                                    return;
                                }
                                // 가입 완료 처리
                                signupComplete();
                            }}
                        >
                            가입 완료
                        </button>
                    </div>
                </>
            )}
        </div>
    );

};

export default Signup;
