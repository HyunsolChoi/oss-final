import React, {useEffect, useState} from 'react'
import './FindIdPw.css'
import {useNavigate} from "react-router-dom";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faEnvelope, faKey, faUser} from "@fortawesome/free-solid-svg-icons";
import {toast} from "react-toastify";
import {checkEmailDuplicate, requestEmailAuth, resetPassword, verifyEmailGetId} from "../../api/auth";

interface Props {
    checkToken: () =>  string | undefined;
}

const FindIdPw: React.FC<Props> = ({ checkToken }) => {
    const [activeTab, setActiveTab] = useState<'findId' | 'resetPw'>('findId');
    const [email, setEmail] = useState('');
    const [codeSent, setCodeSent] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [inputCode, setInputCode] = useState('');
    const [userId, setUserId] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        if (tab === '1') {
            setActiveTab('findId');
        } else if (tab === '2') {
            setActiveTab('resetPw');
        }
    }, []);

    useEffect(() => {
        const validToken = checkToken();

        if(validToken){ // 로그인 되어있으면 페이지 접근불가
            navigate('/');
            return;
        }
    }, [checkToken, navigate]);


    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (codeSent) {
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
    }, [codeSent]);

    const setStates = () => {
        setEmail('');
        setCodeSent(false);
        setIsSending(false);
        setInputCode('');
        setTimeLeft(0);
        setUserId('');
    }

    const formatTime = (sec: number) =>
        `${Math.floor(sec / 60)}:${('0' + (sec % 60)).slice(-2)}`;

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
            if (isAvailable) {
                toast.error('가입되지 않은 이메일입니다');
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

    const resetPasswordHandler = async () => {
        if (!userId || !email) {
            toast.error('아이디와 이메일을 모두 입력해주세요');
            return;
        }

        const res = await resetPassword(userId, email);

        if(!res.success) {
            toast.error(res.message);
            return;
        }

        toast.success("재설정 완료! 이메일을 확인하세요");
        navigate('/signin');
        return;
    };

    const verifyCode = async () => {
        try {
            setIsVerifying(true);

            //error 시에는 바로 catch 됨
            const id = await verifyEmailGetId(email, inputCode);

            if (activeTab === 'findId') {
                setUserId(id);
            } else {
                setUserId(id);
                await resetPasswordHandler();
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err.message);
        } finally {
            setIsVerifying(false);
        }
    };


    return (
        <div className="find-idpw-wrapper">
            <div className="tab-header">
                <button
                    className={activeTab === 'findId' ? 'active-tab' : ''}
                    onClick={() => {
                        setStates();
                        setActiveTab('findId');
                    }}
                >
                    아이디찾기
                </button>
                <button
                    className={activeTab === 'resetPw' ? 'active-tab' : ''}
                    onClick={() => {
                        setStates();
                        setActiveTab('resetPw');
                    }}
                >
                    비밀번호 재설정
                </button>
            </div>
            <div className="tab-content">
                {activeTab === 'findId' && (
                    userId === '' ? (
                        <div className="tab-content-inner">
                            {/* 아이디 찾기 */}
                            <div className="input-group">
                                <FontAwesomeIcon icon={faEnvelope} className="input-icon"/>
                                <input
                                    type="email"
                                    placeholder="email@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <span
                                    className={`show-toggle${isSending ? ' disabled' : ''}`}
                                    onClick={async () => {
                                        if (isSending) return;
                                        await sendVerificationCode();
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
                        </div>
                    ) : (
                        <div className="f-idpw-result">
                            <p>회원님의 아이디는</p>
                            <p className="f-idpw-userid">{userId}</p>
                        </div>
                    )
                )}

                {activeTab === 'resetPw' && (
                    <div>
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
                            <FontAwesomeIcon icon={faEnvelope} className="input-icon"/>
                            <input
                                type="email"
                                placeholder="email@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <span
                                className={`show-toggle${isSending ? ' disabled' : ''}`}
                                onClick={async () => {
                                    if (isSending) return;
                                    await sendVerificationCode();
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
                                    onChange={(e) =>
                                        setInputCode(e.target.value)
                                    }
                                />
                                <span className="timer">{formatTime(timeLeft)}</span>
                                <span className="show-toggle" onClick={verifyCode}>
                                        확인
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
            {isVerifying && (
                <div className="overlay-spinner">
                    <div className="spinner-wrapper">
                        <div className="spinner"/>
                        <p className="spinner-text">인증 확인 중...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FindIdPw
