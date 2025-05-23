import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Signup.css';
import './TermsAgreement.css'

const Agreement: React.FC = () => {
    const [agreedAll, setAgreedAll] = useState(false);
    const [agreements, setAgreements] = useState({
        terms: false,
        privacy: false,
        marketing: false,
    });
    const navigate = useNavigate();

    const handleToggle = (key: keyof typeof agreements) => {
        const updated = { ...agreements, [key]: !agreements[key] };
        setAgreements(updated);
        // 전체 동의 상태 업데이트
        setAgreedAll(updated.terms && updated.privacy);
    };

    const handleAgreeAll = () => {
        const newState = !agreedAll;
        setAgreements({ terms: newState, privacy: newState, marketing: newState });
        setAgreedAll(newState);
    };

    const handleContinue = () => {
        if (agreements.terms && agreements.privacy) {
            navigate('/email');
        } else {
            alert('필수 약관에 모두 동의해주세요.');
        }
    };

    return (
        <div className="signup-wrapper">
            <h2>서비스 이용 동의</h2>
            <div className="input-group">
                <input
                    type="checkbox"
                    checked={agreedAll}
                    onChange={handleAgreeAll}
                    id="agreeAll"
                />
                <label htmlFor="agreeAll">전체 약관 동의</label>
            </div>
            <div className="input-group">
                <input
                    type="checkbox"
                    checked={agreements.privacy}
                    onChange={() => handleToggle('privacy')}
                    id="privacy"
                />
                <label htmlFor="privacy">개인정보 수집·이용 동의
                    <span style={{position: 'relative', color: '#d00', top: '2px'}}>*</span>
                </label>
            </div>
            <div className="agreement-description">
                <div className="bullet-item">
                    <span className="pointer-description">•</span>
                    <span className="text-description">
                      회원 식별(ID), 비밀번호, 이메일 주소를 수집·이용합니다.<br/>
                    </span>
                </div>
                <div className="bullet-item">
                    <span className="pointer-description">•</span>
                    <span className="text-description">
                        희망 직무·기술(경력/자격증) 정보는 맞춤형 컨설팅 제공을 위해 사용하며, 모든 정보는 회원 탈퇴 시까지 보관됩니다.
                    </span>
                </div>
            </div>
            <button className="signup-button" onClick={handleContinue}>
                동의하고 계속
            </button>
        </div>
    );
};

export default Agreement;
