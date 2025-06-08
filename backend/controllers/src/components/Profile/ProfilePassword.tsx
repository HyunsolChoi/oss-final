import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { changePassword } from '../../api/auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock } from '@fortawesome/free-solid-svg-icons';

interface Props {
    userId: string;
}

const ProfilePassword: React.FC<Props> = ({ userId }) => {
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

        if (!isValidPwd(newPwd) || !isValidPwd(currentPwd)) {
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
    }, []);

    return (
        <div className="profile-content">
            <h2>비밀번호 변경</h2>
            <form onSubmit={handlePasswordChange} className="password-form">
                <label>
                    현재 비밀번호
                    <div className="input-group">
                        <FontAwesomeIcon icon={faLock} className="input-icon"/>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            value={currentPwd}
                            onChange={(e) => setCurrentPwd(e.target.value)}
                        />
                        <span
                            className="show-toggle-2"
                            onClick={() => setShowPassword(prev => !prev)}
                        >
                            비밀번호 표시
                        </span>
                    </div>
                </label>

                <label style={{margin: '20px 0 0 0'}}>
                    새 비밀번호
                    <div className="input-group">
                        <FontAwesomeIcon icon={faLock} className="input-icon"/>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            value={newPwd}
                            onChange={(e) => setNewPwd(e.target.value)}
                        />
                    </div>
                </label>

                <label>
                    새 비밀번호 확인
                    <div className="input-group">
                        <FontAwesomeIcon icon={faLock} className="input-icon"/>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            value={confirmPwd}
                            onChange={(e) => setConfirmPwd(e.target.value)}
                        />
                    </div>
                </label>

                <button type="submit" className="submit-button">비밀번호 변경</button>
            </form>
        </div>
    );
};

export default ProfilePassword;
