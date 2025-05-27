import React, {useEffect, useState} from 'react';
import { Routes, Route, useNavigate} from 'react-router-dom';
import {toast, ToastContainer} from 'react-toastify';
import { jwtDecode } from 'jwt-decode';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import Home from './components/Home/Home';
import Navbar from './components/utils/Navbar/Navbar';
import Signin from "./components/Signin/Signin";
import Signup from "./components/Signup/Signup";
import Consulting from "./components/Consulting/Consulting";
import Agreement from "./components/Signup/TermsAgreement"
import Email from "./components/Signup/Email";
import Profile from "./components/Profile/Profile";
import Search from "./components/Search/Search";

interface JwtPayload {
    userId: string;
    exp: number;
}

function App() {
    const [activeTab, setActiveTab] = useState<'Top100' | 'Entry' | 'MyJob'>('Top100');
    const [userId, setUserId] = useState('');
    const [email, setEmail] = useState('');

    const navigate = useNavigate();

    const activeTabHandler = (menu: 1 | 2 | 3) => {
        let newTab: 'Top100' | 'Entry' | 'MyJob';
        if (menu === 1) {
            newTab = 'Top100';
        } else if (menu === 2) {
            newTab = 'Entry';
        } else {
            if(userId===''){
                toast.error('로그인 후 이용 가능합니다');
                navigate('/signin');
                return;
            }
            newTab = 'MyJob';
        }
        if (activeTab !== newTab) {
            setActiveTab(newTab);
        }
    };

    const checkToken = () => {
        const token = localStorage.getItem('token-careerfit');

        if (token) {
            try {
                const decoded = jwtDecode<JwtPayload>(token);
                const now = Date.now() / 1000;

                if (decoded.exp > now) {
                    // 토큰 유효 → 로그인 유지
                    setUserId(decoded.userId);
                    return decoded.userId;
                } else {
                    // 토큰 만료
                    setUserId('');
                    localStorage.removeItem('token-careerfit');
                    return '';
                }
            } catch (e) {
                console.error('토큰 디코딩 실패', e);
                setUserId('');
                localStorage.removeItem('token-careerfit');
                return '';
            }
        }
    }

    useEffect(() => {
        checkToken();
    }, []);


    return (
    <div>
        <Navbar activeTab={activeTab} activeTabHandler={activeTabHandler} userId={userId}/>
        <Routes>
            <Route
                path="/"
                element={<Home activeTab={activeTab} activeTabHandler={activeTabHandler} userId={userId}/>}
            />
            <Route
                path="/signin"
                element={<Signin userId={userId} setUserId={setUserId} checkToken={checkToken}/>}
            />
            <Route
                path="/agreement"
                element={<Agreement/>}>
            </Route>
            <Route
                path="/email"
                element={<Email email={email} setEmail={setEmail}/>}>
            </Route>
            <Route
                path="/signup"
                element={<Signup email={email}/>}>
            </Route>
            <Route
                path="/consulting/:jobId"
                element={<Consulting checkToken={checkToken}/>}>
                {/* userId를 넘겨주고  */}
            </Route>
            <Route path="/search"
                   element={<Search />} >
            </Route>
            <Route
                path="/profile"
                element={<Profile userId={userId}/>}>
            </Route>
        </Routes>
        <ToastContainer
            position="top-center"
            autoClose={2000}
            hideProgressBar
            newestOnTop
            closeOnClick
            draggable={false}
            pauseOnHover
        />
    </div>
  );
}

export default App;
