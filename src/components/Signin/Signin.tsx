// src/components/Signin.tsx
import React, {useEffect, useState} from 'react'
import './Signin.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock } from '@fortawesome/free-solid-svg-icons';
import {toast} from "react-toastify";
import {useNavigate} from "react-router-dom";
import { signin } from '../../api/auth'
import Footer from "../utils/Footer/Footer";

interface Props {
    userId: string;
    setUserId: (id: string) => void;
}

const Signin: React.FC<Props> = ({ userId, setUserId }) => {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [saveId, setSaveId] = useState(false);

    const navigate = useNavigate();

    const isValidUserId = (id: string): boolean => {
        const regex = /^[a-zA-Z0-9]{6,20}$/;
        return regex.test(id);
    };

    const isValidPwd = (pwd: string): boolean => {
        const regex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@])[a-zA-Z\d!@]{8,15}$/;
        return regex.test(pwd);
    };


    const signHandler = async () => {
        if (!userId || !password) {
            toast.error('아이디와 비밀번호를 입력해주세요');
            return;
        }

        if(!isValidUserId(userId) || !isValidPwd(password)) {
            toast.error('유효하지 않은 아이디와 비밀번호 입니다');
            return;
        }

        signin(userId, password)
            .then(result => {
                if (result && 'token' in result) {
                    localStorage.setItem('token-careerfit', result.token);

                    if (saveId) {
                        localStorage.setItem('careerfit-id', userId);
                    } else {
                        localStorage.removeItem('careerfit-id');
                    }

                    navigate('/');
                } else if (result && 'message' in result) {
                    toast.error(result.message);
                } else {
                    toast.error('로그인 실패');
                }
            })
            .catch(() => {
                toast.error('로그인 중 문제가 발생했습니다');
            });
    };

    useEffect(() => {
        const savedId = localStorage.getItem('careerfit-id');
        if (savedId) {
            setUserId(savedId);
            setSaveId(true);
        }
    }, [setUserId]);

    return (
        <div className="wrapper-footer">
            <div className="login-wrapper">
                <h2>로그인</h2>
                <form
                    onSubmit={async (e) => {
                        e.preventDefault(); // 기본 폼 제출 방지
                        await signHandler(); // 로그인 실행
                    }}
                >
                    <div className="input-group">
                        <FontAwesomeIcon icon={faUser} className="input-icon" />
                        <input
                            type="text"
                            placeholder="아이디"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                        />
                    </div>

                    <div className="input-group">
                        <FontAwesomeIcon icon={faLock} className="input-icon" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="비밀번호"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <span className="show-toggle" onClick={() => setShowPassword(!showPassword)}>
                          비밀번호 표시
                        </span>
                    </div>

                    <div className="options">
                        <label>
                            <input
                                type="checkbox"
                                checked={saveId}
                                onChange={(e) => setSaveId(e.target.checked)}
                            />{' '}
                            아이디 저장
                        </label>
                    </div>

                    <button type="submit" className="login-button">로그인</button>

                    <div className="link-row">
                        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                        <a href="#">아이디 찾기</a>
                        {/* todo : 아이디 찾기 비밀번호 재설정 만들어야함 */}
                        <span>|</span>
                        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                        <a href="#">비밀번호 재설정</a>
                        <span>|</span>
                        <a href="/agreement">회원가입</a>
                    </div>
                </form>
            </div>
            <Footer/>
        </div>
    );
}

export default Signin
