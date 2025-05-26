// src/components/Email.tsx
import React, {useEffect, useState} from 'react';
import { requestEmailAuth, verifyEmailAuth, checkEmailDuplicate } from '../../api/auth';
import { toast } from 'react-toastify';
import './Email.css';
import './Signup.css';
import {useNavigate} from "react-router-dom";
import { faEnvelope, faKey } from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

interface EmailProps {
    email: string;
    setEmail: (email: string) => void;
}

const Email: React.FC<EmailProps> = ({ email, setEmail }) => {
    const [inputCode, setInputCode] = useState('');
    const [codeSent, setCodeSent] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);

    const navigate = useNavigate();

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (codeSent && !isVerified) {
            interval = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [codeSent, isVerified]);

    const formatTime = (sec: number) =>
        `${Math.floor(sec / 60)}:${('0' + (sec % 60)).slice(-2)}`;

    const authHandler = () => {
        if(!isVerified){
            toast.error('인증 완료 후 눌러주세요');
            return;
        }
        navigate('/signup');
    }

    // 인증 코드 요청
    const sendVerificationCode = async () => {
        if (isSending) return;

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            toast.error('올바른 이메일 주소를 입력해주세요');
            return;
        }
        if (!email) {
            toast.error('이메일을 입력해주세요');
            return;
        }

        try {
            const isAvailable = await checkEmailDuplicate(email);
            if (!isAvailable) {
                toast.error('이미 가입된 이메일입니다');
                return;
            }

            setIsSending(true);
            setCodeSent(true);
            setTimeLeft(180);

            await requestEmailAuth(email); // 실제 메일 보내는 함수
        } catch (err: any) {
            console.error(err);
            toast.error("유효하지 않은 이메일입니다");
            setCodeSent(false);
        } finally {
            setIsSending(false);           // 전송 중 상태 끝
        }
    };

    // 인증 코드 검증
    const verifyCode = async () => {
        try {
            await verifyEmailAuth(email, inputCode);
            setIsVerified(true);

        } catch (err: any) {
            console.error(err);
            toast.error(err.message);
        }
    };

    return (
        <div className="signup-wrapper">
            <h2>이메일 인증</h2>
            {!isVerified ? (
                <>
                    <div className="input-group">
                        <FontAwesomeIcon icon={faEnvelope} className="input-icon"/>
                        <input
                            type="email"
                            placeholder="email@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={codeSent}
                        />
                        <span
                            className={`show-toggle${isSending ? ' disabled' : ''}`}
                            onClick={() => {
                                if (isSending) return;
                                sendVerificationCode();
                            }}
                        >
                            {codeSent ? '재요청' : '인증 요청'}
                        </span>
                    </div>
                    {codeSent && (
                        <div className="input-group">
                            <FontAwesomeIcon icon={faKey} className="input-icon"/>
                            <input
                                type="text"
                                placeholder="인증 코드 입력"
                                value={inputCode}
                                onChange={(e) => setInputCode(e.target.value)}
                            />
                            <span className="timer">{formatTime(timeLeft)}</span>
                            <span className="show-toggle" onClick={verifyCode}>
                              확인
                            </span>
                        </div>
                    )}
                </>
            ) : (
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
