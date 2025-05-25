import React, {useEffect, useState} from 'react';
import './Profile.css';
import Footer from '../utils/Footer/Footer';
import {changePassword} from "../../api/auth";
import {toast} from "react-toastify";

interface Props {
    userId: string;
}

const Profile: React.FC<Props> = ({ userId }) => {
    const [activeTab, setActiveTab] = useState<'password' | 'info'>('password');
    const [currentPwd, setCurrentPwd] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const isValidPwd = (pwd: string): boolean => {
        const regex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@])[a-zA-Z\d!@]{8,15}$/;
        return regex.test(pwd);
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentPwd || !newPwd || !confirmPwd) {
            toast.error('모든 항목을 입력해주세요');
            return;
        }

        if (newPwd !== confirmPwd) {
            toast.error('새 비밀번호와 확인이 일치하지 않습니다');
            return;
        }

        if (!isValidPwd) {
            toast.error('비밀번호는 영문자, 숫자 및 특수문자(!, @) 8~15자여야 합니다.');
            return;
        }

        const result = await changePassword(userId, currentPwd, newPwd);

        if (result.success) {
            toast.success('비밀번호가 성공적으로 변경되었습니다.');
            setCurrentPwd('');
            setNewPwd('');
            setConfirmPwd('');
        } else {
            toast.error(result.message || '비밀번호 변경 실패');
        }
    };

    useEffect(() => {
        setCurrentPwd('');
        setNewPwd('');
        setConfirmPwd('');
    }, [activeTab]);

    const renderContent = () => {
        if (activeTab === 'password') {
            return (
                <div className="profile-content">
                    <h2>비밀번호 변경</h2>
                    <form onSubmit={handlePasswordChange} className="password-form">
                        <label>
                            현재 비밀번호
                            <div className="input-group">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={currentPwd}
                                    onChange={(e) => setCurrentPwd(e.target.value)}
                                />
                                <span className="show-toggle-2" onClick={() => setShowPassword(prev => !prev)}>
                                    비밀번호 표시
                                </span>
                            </div>
                        </label>
                        <label>
                            비밀번호 변경
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={newPwd}
                                onChange={(e) => setNewPwd(e.target.value)}
                            />
                        </label>

                        <label>
                             비밀번호 변경 확인
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPwd}
                                onChange={(e) => setConfirmPwd(e.target.value)}
                            />
                        </label>
                        <button type="submit" className="submit-button">비밀번호 변경</button>
                    </form>

                </div>
            );
        }

        if (activeTab === 'info') {
            return (
                <div className="profile-content">
                    <h2>입력 정보 변경</h2>
                    <p>여기에 사용자 정보 수정 폼이 들어갑니다.</p>
                </div>
            );
        }
    };

    return (
        <div className="wrapper-footer">
            <div className="profile-wrapper">
                <div className="profile-sidebar">
                    <button
                        className={activeTab === 'password' ? 'active' : ''}
                        onClick={() => setActiveTab('password')}
                    >
                        비밀번호 변경
                    </button>
                    <button
                        className={activeTab === 'info' ? 'active' : ''}
                        onClick={() => setActiveTab('info')}
                    >
                        입력 정보 변경
                    </button>
                </div>
                <div className="profile-main">
                    {renderContent()}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Profile;
