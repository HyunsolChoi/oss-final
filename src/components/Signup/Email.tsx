// src/components/Email.tsx
import React, { useState } from 'react';
import { requestEmailAuth, verifyEmailAuth } from '../../api/jobs';
import './Email.css';
import './Signup.css';
import {useNavigate} from "react-router-dom";
import { faEnvelope, faKey } from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

const Email: React.FC = () => {
    const [email, setEmail] = useState('');
    const [inputCode, setInputCode] = useState('');
    const [codeSent, setCodeSent] = useState(false);
    const [isVerified, setIsVerified] = useState(false);

    const navigate = useNavigate();

    const authHandler = () => {
        if(!isVerified){
            alert('인증 완료 후 눌러주세요');
            return;
        }

        navigate('/signup');
    }

    // 인증 코드 요청
    const sendVerificationCode = async () => {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            alert('올바른 이메일 주소를 입력해주세요');
            return;
        }
        if (!email) {
            alert('이메일을 입력해주세요');
            return;
        }
        // 여기에 들어감.
        try {
            await requestEmailAuth(email);
            setCodeSent(true);
            alert('인증 메일을 보냈습니다');
        } catch (err: any) {
            console.error(err);
            alert(err.message);
        }
    };

    // 인증 코드 검증
    const verifyCode = async () => {
        try {
            await verifyEmailAuth(email, inputCode);
            setIsVerified(true);
        } catch (err: any) {
            console.error(err);
            alert(err.message);
        }
    };

    return (
        <div className="signup-wrapper">
            <h2>이메일 인증</h2>
            <div className="input-group">
                <FontAwesomeIcon icon={faEnvelope} className="input-icon"/>
                <input
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={codeSent || isVerified}
                />
                <span className="show-toggle" onClick={sendVerificationCode}>
          인증 요청
        </span>
            </div>

            {codeSent && !isVerified && (
                <div className="input-group">
                    <FontAwesomeIcon icon={faKey} className="input-icon"/>
                    <input
                        type="text"
                        placeholder="인증 코드 입력"
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value)}
                    />
                    <span className="show-toggle" onClick={verifyCode}>
            확인
          </span>
                </div>
            )}

            {/* 인증 완료 메시지 */}
            {isVerified && (
                <div className="auth-success">
                    이메일 인증이 완료되었습니다!
                </div>
            )}
            {codeSent && (
                <button className="signup-button" onClick={authHandler}>
                    인증 완료
                </button>
            )}
        </div>
    );
};

export default Email;
