import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {getSearchResult} from '../../api/jobs';
import './Search.css';
import {useNavigate} from "react-router-dom";
import { Job } from '../../api/jobs';
import {toast} from "react-toastify";
import Footer from "../utils/Footer/Footer";
import Map from "../utils/Map/Map";

const Search: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [results, setResults] = useState<Job[]>([]);
    const [visibleCount, setVisibleCount] = useState(50);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    const [filteredResults, setFilteredResults] = useState<Job[]>([]);
    const [selectedRegion, setSelectedRegion] = useState<string>('');

    const navigate = useNavigate();

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
            .replace('강원도', '강원')
            .replace('충청북도', '충북')
            .replace('충청남도', '충남')
            .replace('전라북도', '전북')
            .replace('전라남도', '전남')
            .replace('경상북도', '경북')
            .replace('경상남도', '경남');
    };

    const postClickHandler = (jobId : number) => {
        if(jobId <= 0 && jobId === null){
            toast.error("유효하지 않은 공고");
            return;
        }
        navigate(`/consulting/${jobId}`);
        return;
    };

    // todo: job에 필터하도록 수정해야함
    const handleRegionClick = async (region: string) => {
        if (region === selectedRegion || region === '') {
            setSelectedRegion('');
            setFilteredResults([]); // 필터 해제
            return;
        }

        setSelectedRegion(region);

        const norm = normalizeRegion(region);

        const filtered = results.filter(job => {
            if (!job.location) return false;

            if (norm === '광주' && job.location.includes('경기')) {
                return false;
            }

            return job.location.includes(norm);
        });

        setFilteredResults(filtered);
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
        const jobsToRender = (filteredResults.length > 0 ? filteredResults : results).slice(0, visibleCount);

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
                    // eslint-disable-next-line jsx-a11y/anchor-is-valid
                    <a
                        key={job.id}
                        href={'#'}
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
                    <div className="region-map">
                        <Map
                            onRegionClick={handleRegionClick}
                            selectedRegion={selectedRegion}
                        />
                    </div>
                </div>
            </div>
            <Footer/>
        </div>
    );
};

export default Search;