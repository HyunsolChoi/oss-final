import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getSearchResult } from '../../api/jobs';
import './Search.css';
import {useNavigate} from "react-router-dom";
import { Job } from '../../api/jobs';
import {toast} from "react-toastify";
import Footer from "../utils/Footer/Footer"; // Job 타입만 사용

const Search: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [results, setResults] = useState<Job[]>([]);
    const [visibleCount, setVisibleCount] = useState(50);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    const navigate = useNavigate();

    const postClickHandler = (jobId : number) => {
        if(jobId <= 0 && jobId === null){
            toast.error("유효하지 않은 공고");
            return;
        }
        navigate(`/consulting/${jobId}`);
        return;
    };

    useEffect(() => {
        const raw = searchParams.get('query') || '';
        const q = raw.trim();
        setVisibleCount(50);

        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (!q) {
            setResults([]);
            return;
        }

        const spaceCount = (q.match(/\s/g) || []).length;
        if (spaceCount >= 2) {
            setResults([]);
            toast.error("공백은 최대 한개만 포함 가능합니다");
            return;
        }

        if (q.replace(/\s/g, '').length < 2) {
            setResults([]);
            toast.error("검색어가 너무 짧습니다");
            return;
        }

        (async () => {
            try {
                const data = await getSearchResult(q);
                setResults(data);
            } catch (e) {
                console.error('검색 결과 요청 실패:', e);
                setResults([]);
            }
        })();
    }, [searchParams]);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                if (visibleCount < results.length) {
                    setVisibleCount((prev) => prev + 50);
                }
            }
        });

        const target = loadMoreRef.current;
        if (target) observer.observe(target);

        return () => {
            if (target) observer.unobserve(target);
            observer.disconnect();
        };
    }, [visibleCount, results.length]);

    const renderResults = (): React.ReactNode => {
        const jobsToRender = results.slice(0, visibleCount);

        if (results.length === 0) {
            return (
                <div style={{
                    width: '100%',
                    textAlign: 'center',
                    color: '#64748b',
                    fontSize: '1rem',
                    padding: '40px 0'
                }}>
                    검색 결과가 없습니다
                </div>
            );
        }

        return (
            <>
                {jobsToRender.map(job => (
                    <a
                        key={job.id}
                        href={job.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rect-card"
                        onClick={(e)=>{ e.preventDefault(); postClickHandler(job.id)}}
                    >
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
                <div ref={loadMoreRef} style={{ height: '1px' }} />
            </>
        );
    };

    return (
        <div className="search-wrapper">
            <div className="search">
                <div className="list-and-graphic">
                    <div className="list-container">
                        {renderResults()}
                    </div>
                    <div className="graphic">여백</div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Search;