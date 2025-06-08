import React, { useState, useEffect } from 'react';
import './Home.css';
import { Job, getLatestJobs, getTop100Jobs, getEntryLevelJobs, getMyJobs, getJobsByRegion } from '../../api/jobs'
import {useNavigate} from "react-router-dom";
import Footer from "../utils/Footer/Footer";
import {toast} from "react-toastify";
import Map from "../utils/Map/Map";

interface Props {
    userId: string;
    activeTab: 'Top100' | 'Entry' | 'MyJob';
    activeTabHandler: (menu: 1 | 2 | 3) => void;
}

const Home: React.FC<Props> = ({ userId, activeTab, activeTabHandler }) => {
    const [recommendJobs, setLatestJobs] = useState<Job[]>([]);
    const [topJobs,  setTopJobs]    = useState<Job[]>([]);
    const [entryJobs,  setEntryJobs]  = useState<Job[]>([]);
    const [myJobs, setMyJobs] = useState<Job[]>([]);

    const [JobsByRegion, setJobsByRegion] = useState<Job[]>([]);
    const [selectedRegion, setSelectedRegion] = useState<string>('');

    const [visibleCount, setVisibleCount] = useState(50);
    const [isLoadingRegional, setIsLoadingRegional] = useState(false);

    const navigate = useNavigate();
    const loadMoreRef = React.useRef<HTMLDivElement | null>(null);

    const postClickHandler = (jobId : number) => {
        if(jobId <= 0 && jobId === null){
            toast.error("유효하지 않은 공고");
            return;
        }
        navigate(`/consulting/${jobId}`);
        return;
    }

    const normalizeRegion = (region: string): string => {
        return region
            .replace('서울특별시', '서울')
            .replace('부산광역시', '부산')
            .replace('대구광역시', '대구')
            .replace('인천광역시', '인천')
            .replace('광주광역시', '광주')
            .replace('대전광역시', '대전')
            .replace('울산광역시', '울산')
            .replace('세종특별자치시', '세종')
            .replace('제주특별자치도', '제주')
            .replace('경기도', '경기')
            .replace('강원특별자치도', '강원')
            .replace('충청북도', '충북')
            .replace('충청남도', '충남')
            .replace('전라북도', '전북')
            .replace('전라남도', '전남')
            .replace('경상북도', '경북')
            .replace('경상남도', '경남');
    };

    const handleRegionClick = async (region: string) => {
        const currentJobs =
                activeTab === 'Top100'
                    ? topJobs
                    : activeTab === 'Entry'
                        ? entryJobs
                        : myJobs

        setSelectedRegion(region);
        setIsLoadingRegional(true);

        try {
            const norm = normalizeRegion(region);
            const filtered = currentJobs.filter(job => {
                if (!job.location) return false;

                if (norm === '광주' && job.location.includes('경기')) {
                    return false;
                }

                return job.location.includes(norm) || job.location.includes('전국');
            });

            setJobsByRegion(filtered);
        } catch (error) {
            console.error('지역별 공고 조회 실패:', error);
            toast.error('지역별 공고를 불러오는데 실패했습니다');
        } finally {
            setIsLoadingRegional(false);
        }
    };

    const renderCurrentJobs = (
        activeTab: 'Top100' | 'Entry' | 'MyJob',
        topJobs: Job[],
        entryJobs: Job[],
        myJobs: Job[]
    ): React.ReactNode => {
        const currentJobs =
            activeTab === 'Top100'
                ? topJobs
                : activeTab === 'Entry'
                    ? entryJobs
                    : myJobs

        const jobsToRender = (selectedRegion ? JobsByRegion : currentJobs).slice(0, visibleCount);

        if (currentJobs.length === 0 || (selectedRegion && JobsByRegion.length === 0)) {
            const emptyMessage = '공고가 없습니다';
            return (
                <div style={{
                    width: '100%',
                    textAlign: 'center',
                    color: '#64748b',
                    fontSize: '1rem',
                    padding: '40px 0'
                }}>
                    {emptyMessage}
                </div>
            );
        }

        return (
            <>
                {jobsToRender.map(job => (
                    <a
                        key={job.id}
                        href={'#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rect-card"
                        onClick={(e)=>{
                            e.preventDefault(); postClickHandler(job.id)}}>

                        <div className="card-content">
                            <div className="info">
                                <div className="title">{job.title}</div>
                                <div className="meta">
                                    <span>{job.company}</span>
                                    {job.location && <div className="sectors">{job.location}</div>}
                                    {job.sectors && <div className="sectors">{job.sectors}</div>}
                                    {job.experience && <span>{job.experience}</span>}
                                </div>
                            </div>
                            <div className="meta-right">
                                {job.views !== undefined && (
                                    <div className="views">조회수 {job.views.toLocaleString()}회</div>
                                )}
                                <div className="deadline">{job.deadline}</div>
                            </div>
                        </div>
                    </a>
                ))}
                <div ref={loadMoreRef} style={{height: '1px'}}/>
            </>
        );
    };

    useEffect(() => {
        //지역필터링이 적용된 상태에서 탭이 전환되는 경우
        if (selectedRegion) handleRegionClick(selectedRegion);
        else setJobsByRegion([]);

        setVisibleCount(50);
    }, [activeTab]);

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

    // 스크롤 최하위로 하면 공고 추가 렌더링을 위한,,,
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                const currentJobs =
                    activeTab === 'Top100'
                        ? topJobs
                        : activeTab === 'Entry'
                            ? entryJobs
                            : myJobs;

                if (visibleCount < currentJobs.length) {
                    setVisibleCount((prev) => prev + 50);
                }
            }
        });

        const currentTarget = loadMoreRef.current;
        if (currentTarget) {
            observer.observe(currentTarget);
        }

        return () => {
            if (currentTarget) observer.unobserve(currentTarget);
            observer.disconnect();
        };
    }, [visibleCount, activeTab, topJobs, entryJobs, myJobs]);

    useEffect(() => {
        if(userId !== ''){ // 토큰검사는 app.tsx 에서 하고 userId를 하위 컴포넌트로 뿌림
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
                                <div
                                    key={job.id}
                                    onClick={() => navigate(`/consulting/${job.id}`)}
                                    className="recommend-card"
                                    style={{cursor: 'pointer'}}
                                >
                                    <div className="title">{job.title}</div>
                                    <div className="company">{job.company}</div>
                                    <div className="deadline">기한: {job.deadline}</div>
                                </div>
                            ))}
                        </div>
                        {userId === '' && (
                            <div className="glass-overlay" onClick={() => navigate("/signin")}>
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
                            onClick={() => {activeTabHandler(1);}}
                        >
                            Top100
                        </button>
                        <button
                            className={`tab ${activeTab === 'Entry' ? 'active' : ''}`}
                            onClick={() => {activeTabHandler(2);}}
                        >
                            신입
                        </button>
                        <button
                            className={`tab ${activeTab === 'MyJob' ? 'active' : ''} ${userId === '' ? 'disabled-tab' : ''}`}
                            onClick={() => {activeTabHandler(3);}}
                        >
                            나의 직무
                        </button>
                    </div>
                    <div className="list-and-graphic">
                        <div className="list-container">
                            {renderCurrentJobs(activeTab, topJobs, entryJobs, myJobs)}
                        </div>

                        <div className="region-map">
                            <Map
                                onRegionClick={handleRegionClick}
                                selectedRegion={selectedRegion}
                            />
                        </div>
                    </div>
                </section>
            </div>
            <Footer />
        </div>
    );
};

export default Home;