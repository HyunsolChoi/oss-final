import React, {useEffect, useState} from 'react';
import './Profile.css';
import Footer from '../utils/Footer/Footer';
import {toast} from "react-toastify";
import ProfileInfo from "./ProfileInfo";
import ProfilePassword from './ProfilePassword';
import {useNavigate} from "react-router-dom";

interface Props {
    userId: string;
}

const Profile: React.FC<Props> = ({ userId }) => {
    const [activeTab, setActiveTab] = useState<'password' | 'info'>('info');
    
    const navigate = useNavigate();

    const renderContent = () => {
        if (activeTab === 'password') return <ProfilePassword userId={userId} />;
        if (activeTab === 'info') return <ProfileInfo userId={userId} />;
    };

    useEffect(() => {
        if(userId===''){
            toast.error("로그인 이후 이용 가능합니다");
            navigate('/signin');
            return;
        }
    }, [navigate, userId]);

    return (
        <div className="wrapper-footer">
            <div className="profile-wrapper">
                <div className="profile-sidebar">
                    <button
                        className={activeTab === 'info' ? 'active' : ''}
                        onClick={() => setActiveTab('info')}
                    >
                        내 정보 변경
                    </button>
                    <button
                        className={activeTab === 'password' ? 'active' : ''}
                        onClick={() => setActiveTab('password')}
                    >
                        비밀번호 변경
                    </button>
                </div>
                <div className="profile-main">
                    {renderContent()}
                </div>
            </div>
            <Footer/>
        </div>
    );
};

export default Profile;
