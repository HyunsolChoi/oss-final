import React, {useState} from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './components/Home/Home';
import Navbar from './components/Navbar/Navbar';
import Signin from "./components/Signin/Signin";
import Signup from "./components/Signup/Signup";
import Consulting from "./components/Consulting/Consulting";
import Agreement from "./components/Signup/TermsAgreement"
import Email from "./components/Signup/Email";

function App() {
    const [activeTab, setActiveTab] = useState<'Top100' | 'Entry'>('Top100');
    const [userId, setUserId] = useState('');

    return (
    <div>
    <BrowserRouter>
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab}  userId={''}/> {/*임의 아이디*/}
        <Routes>
            <Route
                path="/"
                element={<Home activeTab={activeTab} setActiveTab={setActiveTab} />}
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
    </BrowserRouter>
    </div>
  );
}

export default App;
