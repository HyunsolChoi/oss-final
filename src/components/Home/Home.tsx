// src/components/Home.tsx
import React, { useState, useEffect, FC } from 'react';
import './Home.css';
import { Job, getLatestJobs, getTop100Jobs, getEntryLevelJobs } from '../../api/jobs'

interface Props {
    activeTab: 'Top100' | 'Entry';
    setActiveTab: (tab: 'Top100' | 'Entry') => void;
}

const Home: React.FC<Props> = ({ activeTab, setActiveTab }) => {
    const [recommendJobs, setLatestJobs] = useState<Job[]>([]);
    const [topJobs,    setTopJobs]    = useState<Job[]>([]);
    const [entryJobs,  setEntryJobs]  = useState<Job[]>([]);

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

    return (
        <div className="home-parent">
            <div className="home-children">
                {/* --- 상단: 5x2 정사각 카드 --- */}
                <section className="section-recommend">
                    <h2 style={{color: '#1e293b'}}>AI-추천공고</h2>
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
                </section>

                {/* --- 하단: 탭 + 리스트 --- */}
                <section className="section-list">
                    <div className="tabs">
                        <button
                            className={`tab ${activeTab === 'Top100' ? 'active' : ''}`}
                            onClick={() => setActiveTab('Top100')}
                        >
                            Top 100
                        </button>
                        <button
                            className={`tab ${activeTab === 'Entry' ? 'active' : ''}`}
                            onClick={() => setActiveTab('Entry')}
                        >
                            신입
                        </button>
                    </div>
                    <div className="list-and-graphic">
                        <div className="list-container">
                            {(activeTab === 'Top100' ? topJobs : entryJobs).map(job => (
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
