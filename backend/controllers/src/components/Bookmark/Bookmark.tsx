import React, { useState, useEffect } from 'react';
import './Bookmark.css';
import { toast } from 'react-toastify';
import { Job } from "../../api/jobs";
import {deleteBookmarks, getBookmarkedJobs} from "../../api/bookmark";
import {useNavigate} from "react-router-dom";

interface Props {
    checkToken: () => string | undefined;
}

const Bookmark: React.FC<Props> = ({ checkToken }) => {
    const [userId, setUserId] = useState('');
    const [jobs, setJobs] = useState<Job[]>([]);
    const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());

    const navigate = useNavigate();

    useEffect(() => {
        const id = checkToken();
        if (!id) {
            toast.error('로그인이 필요합니다.');
            navigate('/signin');
            window.location.reload();
            return;
        }

        setUserId(id);

        (async () => {
            try {
                const data = await getBookmarkedJobs(id);
                setJobs(data);
            } catch (err) {
                console.error(err);
                toast.error('즐겨찾기 정보를 불러오지 못했습니다');
            }
        })();
    }, [checkToken, navigate]);

    const toggleCheck = (id: number) => {
        const updated = new Set(checkedIds);
        updated.has(id) ? updated.delete(id) : updated.add(id);
        setCheckedIds(updated);
    };

    const toggleAll = () => {
        if (checkedIds.size === jobs.length) setCheckedIds(new Set());
        else setCheckedIds(new Set(jobs.map(job => job.id)));
    };

    const deleteSelected = async () => {
        if (checkedIds.size === 0) return;

        try {
            await deleteBookmarks(userId, Array.from(checkedIds));
            setJobs(prev => prev.filter(job => !checkedIds.has(job.id)));
            setCheckedIds(new Set());
        } catch (e: any) {
            console.error(e);
            toast.error(e.message || '삭제 중 오류 발생');
        }
    };

    return (
        <div className="home-parent">
            <div className="home-children">
                <div className="bookmark-wrapper">
                    <div className="bookmark-controls">
                        <button onClick={toggleAll} disabled={jobs.length === 0}>
                            {checkedIds.size === jobs.length && jobs.length > 0 ? '전체 해제' : '전체 선택'}
                        </button>
                        <button onClick={deleteSelected} disabled={checkedIds.size === 0}>
                            선택 삭제
                        </button>
                    </div>

                    {jobs.length === 0 ? (
                        <div className="bookmark-empty">
                            <div className="bookmark-empty-text">즐겨찾기 항목이 비어있습니다</div>
                            <div className="bookmark-empty-action" onClick={() => navigate('/')}>
                                마음에 드는 공고를 즐겨찾기에 등록해보세요!
                            </div>
                        </div>
                    ) : (
                        <ul className="bookmark-list">
                            {jobs.map(job => (
                                <li key={job.id} className="bookmark-card"
                                    onClick={() => navigate(`/consulting/${job.id}`)}>
                                <input
                                        type="checkbox"
                                        className="bookmark-checkbox"
                                        checked={checkedIds.has(job.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={() => toggleCheck(job.id)}
                                    />
                                    <div className="bookmark-content">
                                        <div className="bookmark-header">
                                            <div className="bookmark-title">{job.title}</div>
                                            <a
                                                className="bookmark-link"
                                                href={job.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                사람인 바로가기
                                            </a>
                                        </div>
                                        <div className="bookmark-meta">
                                            <span>{job.company}</span> |{' '}
                                            <span>{job.location || '미기재'}</span> |{' '}
                                            <span>{job.experience || '미기재'}</span> |{' '}
                                            <span>{job.employmentType || '미기재'}</span>
                                        </div>
                                        <div className="bookmark-deadline">기한: {job.deadline}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Bookmark;
