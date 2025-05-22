import React, {useState} from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './components/Home/Home';
import Navbar from './components/Navbar/Navbar';

function App() {

    const [activeTab, setActiveTab] = useState<'Top100' | 'Entry'>('Top100');


    return (
    <div>
    <BrowserRouter>
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab}  userId={"shs9064"}/> {/*임의 아이디*/}
        <Routes>
            <Route
                path="/"
                element={<Home activeTab={activeTab} setActiveTab={setActiveTab} />}
            />
        </Routes>
    </BrowserRouter>
    </div>
  );
}

export default App;
