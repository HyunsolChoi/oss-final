// src/components/Home.tsx
import React, { useState, useEffect, FC } from 'react';
import './Home.css';
import { Job, getLatestJobs, getTop100Jobs, getEntryLevelJobs, getMyJobs } from '../../api/jobs'
import {useNavigate} from "react-router-dom";

interface Props {
    userId: string;
    activeTab: 'Top100' | 'Entry' | 'MyJob';
    setActiveTab: (tab: 'Top100' | 'Entry' | 'MyJob') => void;
    activeTabHandler: (menu: 1 | 2 | 3) => void;
}

const Home: React.FC<Props> = ({ userId, activeTab, setActiveTab, activeTabHandler }) => {
    const [recommendJobs, setLatestJobs] = useState<Job[]>([]);
    const [topJobs,    setTopJobs]    = useState<Job[]>([]);
    const [entryJobs,  setEntryJobs]  = useState<Job[]>([]);
    const [myJobs, setMyJobs] = useState<Job[]>([]);

    //const [showJobs, setShowJobs] = useState<Job[]>([]); // 실제로 화면에 나오는 공고 ( Top100, Entry )
    const navigate = useNavigate();

    useEffect(() => {
        getLatestJobs()
            .then(setLatestJobs)
            .catch(console.error)

        getTop100Jobs()
            .then(setTopJobs)
            .catch(console.error)

        getEntryLevelJobs()
            .then(setEntryJobs)
            .catch(console.error)

    }, [])

    useEffect(() => {
        if(userId !== ''){ // todo: 토큰으로 검사해야한다  (app)
            getMyJobs(userId)
                .then(setMyJobs)
                .catch(console.error)
        }
    }, [userId]);

    return (
        <div className="home-parent">
            <div className="home-children">

                {/* --- 상단: 5x2 정사각 카드 --- */}
                <section className="section-recommend">
                    <h2 style={{color: '#1e293b'}}>AI-추천공고</h2>
                    <div className="recommend-wrapper">
                        <div className="recommend-container">
                            {recommendJobs.map(job => (
                                <a
                                    key={job.id}
                                    href={job.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="recommend-card"
                                >
                                    <div className="title">{job.title}</div>
                                    <div className="company">{job.company}</div>
                                    <div className="deadline">기한: {job.deadline}</div>
                                </a>
                            ))}
                        </div>
                        {userId === '' && (
                            <div className="glass-overlay" onClick={()=> navigate("/signin")}>
                                로그인 후 공고를 추천 받아보세요
                            </div>
                        )}
                    </div>
                </section>

                {/* --- 하단: 탭 + 리스트 --- */}
                <section className="section-list">
                    <div className="tabs">
                        <button
                            className={`tab ${activeTab === 'Top100' ? 'active' : ''}`}
                            onClick={() => activeTabHandler(1)}
                        >
                            Top100
                        </button>
                        <button
                            className={`tab ${activeTab === 'Entry' ? 'active' : ''}`}
                            onClick={() => activeTabHandler(2)}
                        >
                            신입
                        </button>
                        <button
                            className={`tab ${activeTab === 'MyJob' ? 'active' : ''}`}
                            onClick={() => activeTabHandler(3)}
                        >
                            나의 직무
                        </button>
                    </div>
                    <div className="list-and-graphic">
                        <div className="list-container">
                            {(
                                activeTab === 'Top100'
                                    ? topJobs
                                    : activeTab === 'Entry'
                                        ? entryJobs
                                        : myJobs
                            ).map(job => (
                                <a
                                    key={job.id}
                                    href={job.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rect-card"
                                >
                                    <div className="info">
                                        <div className="title">{job.title}</div>
                                        <div className="meta">
                                            <span>{job.company}</span>
                                            {job.experience && <span>{job.experience}</span>}
                                            {job.salary && <span>{job.salary}</span>}
                                        </div>
                                    </div>
                                    <div className="deadline">{job.deadline}</div>
                                </a>
                            ))}
                        </div>
                        <div className="graphic">여백</div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Home;
