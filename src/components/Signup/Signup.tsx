import React, {useEffect, useState} from 'react';
import './Signup.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock, faBriefcase, faLightbulb  } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import {useNavigate} from "react-router-dom";

const Signup: React.FC = () => {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);
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

    const hasDuplicateSkills = (skills: string[]): boolean => {
        const trimmed = skills.map(s => s.trim()).filter(s => s !== '');
        const unique = new Set(trimmed);
        return unique.size !== trimmed.length;
    };

    const signupComplete = () => {
        if(!isValidUserId(userId) || !isValidPwd(password) || userId===password){
            toast.error("유효하지 않은 아이디와 비밀번호 입니다.")
            return;
        }
        if (hasDuplicateSkills(skills)) {
            toast.error("기술 항목에 중복된 값이 있습니다.");
            return;
        }

        // todo : DB로 사용자 입력 정보 모두 보내기

        navigate("/signin");
    }

    useEffect(() => {
        const cookies = document.cookie
            .split(';')
            .map(cookie => cookie.trim());

        const hasAgreement = cookies.some(cookie =>
            cookie.startsWith('agreementAccepted=')
        );
        const hasEmailVerified = cookies.some(cookie =>
            cookie.startsWith('emailVerified=')
        );

        if (!hasAgreement || !hasEmailVerified) {
            // 약관 동의가 없으면 동의 페이지로
            toast.error("세션이 만료되어 동의 페이지로 이동합니다")
            navigate('/agreement');
        }
    }, []);


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
                            onClick={() => setShowPassword(!showPassword)}
                        >
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
                        onClick={() => {
                            if (!userId || !password || !confirmPassword) {
                                toast.error("모든 항목을 입력해주세요.");
                                return;
                            }
                            if (!isValidUserId(userId)) {
                                toast.error("아이디는 영문자 및 숫자 6~20자여야 합니다.");
                                return;
                            }
                            if (!isValidPwd(password)) {
                                toast.error("비밀번호는 영문자, 숫자 및 특수문자(!, @) 8~15자여야 합니다.");
                                return;
                            }
                            if(userId === password){
                                toast.error("아이디와 비밀번호는 같을 수 없습니다.");
                                return;
                            }
                            setShowNext(true);
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
                            <option value="noInput">미입력</option>
                            <option value="middleschool">중학교 졸업</option>
                            <option value="highschool">고등학교 졸업</option>
                            <option value="associate">전문학사 (2~3년제)</option>
                            <option value="bachelor">학사</option>
                            <option value="master">석사</option>
                            <option value="doctorate">박사</option>
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
