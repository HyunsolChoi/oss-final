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

        if (!hasAgreement) {
            // 약관 동의가 없으면 동의 페이지로
            toast.error("세션이 만료되어 동의 페이지로 이동합니다")
            navigate('/agreement');
        } else if (!hasEmailVerified) {
            // 이메일 인증이 없으면 인증 페이지로
            toast.error("세션이 만료되어 이메일 인증 페이지로 이동합니다")
            navigate('/email');
        }
    }, []);


    return (
        <div className="signup-wrapper">
            <h2>회원가입</h2>
            <div className="input-group">
                <FontAwesomeIcon icon={faUser} className="input-icon"/>
                <input
                    type="text"
                    placeholder="아이디"
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
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="비밀번호 확인"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <span
                    className="show-toggle"
                    onClick={() => setShowConfirm(!showConfirm)}
                >
          비밀번호 표시
        </span>
            </div>

            <div className="input-description">
                <span className="pointer">*</span> 예: 백엔드, 재무회계, 세무사 등
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
                <span className="pointer">*</span> 한 개 이상의 기술(경력, 자격증)을 입력하세요
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
                        <span className="show-toggle" onClick={() => removeSkillField(idx)}>
                          삭제
                        </span>
                    )}
                </div>
            ))}

            {/* 기술 추가 버튼 */}
            {skills.length < 15 && (
                <button type="button" className="add-skill-button" onClick={addSkillField}>
                    + 기술 추가 ({skills.length}/15)
                </button>
            )}

            <button className="signup-button">회원가입</button>
        </div>
    );
};

export default Signup;
