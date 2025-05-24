import React, {useState} from 'react';
import {BrowserRouter, Routes, Route, useNavigate} from 'react-router-dom';
import {toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import Home from './components/Home/Home';
import Navbar from './components/Navbar/Navbar';
import Signin from "./components/Signin/Signin";
import Signup from "./components/Signup/Signup";
import Consulting from "./components/Consulting/Consulting";
import Agreement from "./components/Signup/TermsAgreement"
import Email from "./components/Signup/Email";

function App() {
    const [activeTab, setActiveTab] = useState<'Top100' | 'Entry' | 'MyJob'>('Top100');
    const [userId, setUserId] = useState('');

    const navigate = useNavigate();

    const activeTabHandler = (menu: 1 | 2 | 3) => {
        let newTab: 'Top100' | 'Entry' | 'MyJob';
        if (menu === 1) {
            newTab = 'Top100';
        } else if (menu === 2) {
            newTab = 'Entry';
        } else {
            if(userId===''){ // todo: 토큰으로 검사해야한다  (app)
                toast.error('로그인 후 이용 가능합니다');
                navigate('/signin');
                return;
            }
            newTab = 'MyJob';
        }
        if (activeTab !== newTab) {
            setActiveTab(newTab);
        }
        window.scrollTo({ top: 515, behavior: 'smooth' });
    };

    return (
    <div>
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} activeTabHandler={activeTabHandler} userId={''}/> {/*임의 아이디*/}
        <Routes>
            <Route
                path="/"
                element={<Home activeTab={activeTab} setActiveTab={setActiveTab} activeTabHandler={activeTabHandler} userId={''}/>}
            />
            <Route
                path="/signin"
                element={<Signin userId={userId} setUserId={setUserId}/>}
            />
            <Route
                path="/agreement"
                element={<Agreement/>}>
            </Route>
            <Route
                path="/email"
                element={<Email/>}>
            </Route>
            <Route
                path="/signup"
                element={<Signup/>}>
            </Route>
            <Route
                path="/consulting"
                element={<Consulting/>} // token 넘겨줘서 유효성 판단 후 진입 가능하도록 해야함
            ></Route>
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
