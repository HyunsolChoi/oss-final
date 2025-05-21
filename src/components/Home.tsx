// src/components/Home.tsx
import React, { useState, useEffect, FC } from 'react';
import './Home.css';
import { Job, getLatestJobs, getTop100Jobs, getEntryLevelJobs } from '../api/jobs'

const Home: FC = () => {
    const [latestJobs, setLatestJobs] = useState<Job[]>([]);
    const [topJobs,    setTopJobs]    = useState<Job[]>([]);
    const [entryJobs,  setEntryJobs]  = useState<Job[]>([]);
    const [activeTab,  setActiveTab]  = useState<'Top100' | 'Entry'>('Top100');

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
        <div className="home-wrapper">
            {/* --- 상단: 4x2 정사각 카드 --- */}
            <section className="section-latest">
                <h2>가장 적합한 직군</h2>
                <div className="latest-container">
                    {latestJobs.map(job => (
                        <a
                            key={job.id}
                            href={job.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="latest-card"
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
                        신입 채용
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
                                        {job.salary    && <span>{job.salary}</span>}
                                    </div>
                                </div>
                                <div className="deadline">기한: {job.deadline}</div>
                            </a>
                        ))}
                    </div>
                    <div className="graphic">여백</div>
                </div>
            </section>
        </div>
    );
};

export default Home;
