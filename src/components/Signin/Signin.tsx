// src/components/Signin.tsx
import React, {useState} from 'react'
import './Signin.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock } from '@fortawesome/free-solid-svg-icons';

interface Props {
    userId: string;
    setUserId: (id: string) => void;
}

const Signin: React.FC<Props> = ({ userId, setUserId }) => {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="login-wrapper">
            <h2>로그인</h2>
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
                    <input type="checkbox" /> 아이디 저장
                </label>
            </div>

            <button className="login-button">로그인</button>

            <div className="link-row">
                <a href="#">비밀번호 재설정</a>
                <span>|</span>
                <a href="/signup">회원가입</a>
            </div>
        </div>
    );
}

export default Signin
