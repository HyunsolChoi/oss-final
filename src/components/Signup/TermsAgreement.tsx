import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Signup.css';
import './TermsAgreement.css'

const Agreement: React.FC = () => {
    const [agreedAll, setAgreedAll] = useState(false);
    const [agreements, setAgreements] = useState({
        terms: false,
        privacy: false,
        marketing: false,
    });
    const [showTermsModal, setShowTermsModal] = useState(false);

    const openTermsModal = () => setShowTermsModal(true);
    const closeTermsModal = () => setShowTermsModal(false);
    const navigate = useNavigate();

    const handleToggle = (key: keyof typeof agreements) => {
        const updated = { ...agreements, [key]: !agreements[key] };
        setAgreements(updated);
        setAgreedAll(updated.terms && updated.privacy);
    };

    const handleAgreeAll = () => {
        const newState = !agreedAll;
        setAgreements({ terms: newState, privacy: newState, marketing: newState });
        setAgreedAll(newState);
    };

    const handleContinue = () => {
        if (agreements.terms && agreements.privacy) {

            // 동의 완료 쿠키에 기록
            document.cookie = [
                'agreementAccepted=true',
                'path=/',
                'max-age=3600',       // 1시간(초 단위)
                'sameSite=Lax',
                process.env.NODE_ENV === 'production' ? 'secure' : ''
            ].filter(Boolean).join('; ');

            navigate('/email');
        } else {
            toast.error('필수 약관에 모두 동의해주세요.');
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
                    checked={agreements.terms}
                    onChange={() => handleToggle('terms')}
                    id="terms"
                />
                <label htmlFor="terms">CareerFit 이용 약관
                    <span style={{position: 'relative', color: '#d00', top: '3px'}}>*</span>
                </label>
                <span
                    onClick={openTermsModal}
                    style={{
                        marginLeft: '8px',
                        fontSize: '0.8rem',
                        color: '#2563eb',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                    }}
                >
                    보기
                </span>
            </div>
            <div className="input-group">
                <input
                    type="checkbox"
                    checked={agreements.privacy}
                    onChange={() => handleToggle('privacy')}
                    id="privacy"
                />
                <label htmlFor="privacy">개인정보 수집·이용 동의
                    <span style={{position: 'relative', color: '#d00', top: '3px'}}>*</span>
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
            {showTermsModal && (
                <div className="modal-backdrop" onClick={closeTermsModal}>
                    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                        <h3>CareerFit 이용 약관</h3>
                        <p> CareerFit에 오신 여러분을 환영합니다. </p>
                        <p className="description">
                            <h4>1. 서비스 개요 </h4>
                            <span className="text-1">
                            CareerFit은 사용자의 희망 직무, 관심 산업, 보유 기술 등을 바탕으로 채용 공고와 커리어 관련 컨설팅을 제공하는 서비스입니다.
                            일부 기능은 GPT 기반 알고리즘을 통해 자동 생성된 답변을 포함하며, 사용자는 이를 참고용으로 활용할 수 있습니다.
                            </span>
                            <h4>2. 사용자 계정 </h4>
                            <span className="pointer-description">• </span>
                            <span className="text">사용자는 본인의 정확한 정보를 사용해 계정을 생성해야 합니다. <br/>
                            </span>
                            <span className="pointer-description">•</span>
                            <span className="text">타인의 정보를 도용하거나 허위 정보를 입력하는 경우 서비스 이용이 제한될 수
                            있습니다.<br/> </span>
                            <span className="pointer-description">•</span>
                            <span className="text">비밀번호 및 로그인 정보는 사용자가 책임지고 관리해야 하며, 타인에게 공유하지
                            않아야 합니다.<br/> </span>

                            <h4>3. 서비스 이용 시 지켜야 할 사항 </h4>
                            <span className="text-1">
                            CareerFit은 모든 사용자가 안전하고 긍정적인 경험을 할 수 있도록 아래와 같은 행위를 금지합니다.
                            </span>
                            <span className="pointer-description">•</span>
                            <span className="text">타인의 개인정보를 무단 수집, 공유하거나 침해하는 행위 <br/>
                            </span>
                            <span className="pointer-description">•</span>
                            <span className="text">부적절하거나 불쾌감을 주는 표현 사용 <br/>
                            </span>
                            <span className="pointer-description">•</span>
                            <span className="text">시스템을 해킹하거나 비정상적인 방식으로 이용하려는 시도 <br/>
                            </span>
                            <span className="pointer-description">•</span>
                            <span className="text">GPT의 응답을 악용하거나 오용하는 행위 (예: 용도 외 사용 및 의도) <br/>
                            </span>

                            <h4>4. GPT 기반 컨설팅에 대한 안내</h4>
                            <span className="pointer-description">•</span>
                            <span className="text">CareerFit은 OpenAI의 GPT를 활용하여 개인 맞춤형 컨설팅을 제공합니다. <br/>
                            </span>
                            <span className="pointer-description">•</span>
                            <span className="text">해당 응답은 조언 및 참고용으로 제공되며, CareerFit은 응답의 정확성, 완전성 또는 최종 결과에 대한 법적 책임을 지지 않습니다. <br/>
                            </span>
                            <span className="pointer-description">•</span>
                            <span
                                className="text">사용자는 모든 중요한 결정(입사 지원, 진로 선택 등)을 내리기 전에 본인의 판단과 추가 조사를 기반으로 결정해야 합니다. <br/>
                            </span>

                            <h4>5. 개인정보 수집 및 사용</h4>
                            <span className="text-1">
                            CareerFit은 원활한 서비스 제공을 위해 아래 정보를 수집할 수 있습니다.
                            </span><br/>
                            <span className="pointer-description">•</span>
                            <span className="text">이름, 이메일 주소, 직무 관심사, 기술 보유 여부 등 사용자 제공 정보 <br/>
                            </span>
                            <span className="pointer-description">•</span>
                            <span className="text">서비스 이용 중 자동 수집되는 사용 로그 및 이용 이력<br/>
                            </span>
                            <span className="text-1" style={{
                                paddingTop: "5px",
                                display: "inline-block"
                            }}>
                            수집된 정보는 다음의 목적으로만 사용됩니다.
                            </span><br/>
                            <span className="pointer-description">•</span>
                            <span
                                className="text">개인화된 채용 공고 추천<br/>
                            </span>
                            <span className="pointer-description">•</span>
                            <span
                                className="text">GPT 기반 커리어 컨설팅 제공<br/>
                            </span>
                            <span className="text-1" style={{
                                paddingTop: "5px",
                                display: "inline-block"
                            }}>
                            개인정보는 탈퇴 시 즉시 삭제됩니다.
                            </span>
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Agreement;
