// src/components/utils/Navbar/Navbar.tsx
import React, {useEffect, useRef, useState} from 'react'
import {useLocation, useNavigate, useSearchParams} from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleUser, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import {signout} from '../../../api/auth'
import './Navbar.css'
import {toast} from "react-toastify";

interface Props {
    userId: string;
    activeTab: 'Top100' | 'Entry' | 'MyJob' | 'Regional';
    activeTabHandler: (menu: 1 | 2 | 3 | 4) => void;
}

const Navbar: React.FC<Props> = ({ userId, activeTab, activeTabHandler }) => {
    const [scrolled, setScrolled] = useState(false);
    const [placeholder, setPlaceholder] = useState('검색어를 입력하세요');
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [searchParams] = useSearchParams();

    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const location = useLocation();

    const signoutHandler = () => {
        signout(userId)
            .then(() => {
                localStorage.removeItem('token-careerfit');
                localStorage.removeItem('careerfit-id');
                navigate('/');
                window.location.reload();
            })
            .catch(() => {
                toast.error('로그아웃 중 문제가 발생했습니다.');
            });
    };

    const onLogoClick = () => {
        if (location.pathname === '/') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            navigate('/');
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            if (window.location.pathname === '/') {
                setScrolled(window.scrollY >= 490);
            }else{
                setScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setShowDropdown(false);
            }
        };

        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDropdown]);

    useEffect(() => {
        const isSearchPage = location.pathname === '/search';

        if (isSearchPage) {
            const query = searchParams.get('query') || '';
            setSearchInput(query);
        } else {
            setSearchInput('');
        }
    }, [location.pathname, searchParams]);

    const searchHandler = () => {
        const trimmed = searchInput.trim();
        if (trimmed) {
            navigate(`/search?query=${encodeURIComponent(trimmed)}`);
        }
    };

    return (
        <nav className="navbar-wrapper">
            <div className="navbar">
                <div className="navbar-logo" onClick={() => onLogoClick()}>CareerFit</div>
                <ul className={`navbar-links ${scrolled ? 'scrolled' : ''}`}>
                    <li>
                        <a href="#"
                           className={scrolled && activeTab === 'Top100' ? 'scrolled-active' : ''}
                           onClick={(e) => {
                               e.preventDefault();
                               activeTabHandler(1);
                               window.scrollTo({ top: 515, behavior: 'smooth' });
                           }}
                        >
                            Top100
                        </a>
                    </li>
                    <li>
                        <a href="#"
                           className={scrolled && activeTab === 'Entry' ? 'scrolled-active' : ''}
                           onClick={(e) => {
                               e.preventDefault();
                               activeTabHandler(2);
                               window.scrollTo({ top: 515, behavior: 'smooth' });
                           }}
                        >
                            신입
                        </a>
                    </li>
                    <li>
                        <a href="#"
                           className={scrolled && activeTab === 'MyJob' ? 'scrolled-active' : ''}
                           onClick={(e) => {
                               e.preventDefault();
                               activeTabHandler(3);
                               window.scrollTo({ top: 515, behavior: 'smooth' });
                           }}
                        >
                            나의 직무
                        </a>
                    </li>
                    <li>
                        <a href="#"
                           className={scrolled && activeTab === 'Regional' ? 'scrolled-active' : ''}
                           onClick={(e) => {
                               e.preventDefault();
                               activeTabHandler(4);
                               window.scrollTo({ top: 515, behavior: 'smooth' });
                           }}
                        >
                            지역별
                        </a>
                    </li>
                </ul>
                <div className={`search-container ${scrolled ? 'scrolled' : ''}`}>
                    <input
                        type="text"
                        placeholder={placeholder}
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') searchHandler();
                        }}
                        onClick={() => setPlaceholder("기업명, 키워드, 직무를 검색해보세요")}
                        onBlur={() => setPlaceholder("검색어를 입력하세요")}
                    />
                    <button className="search-button" onClick={searchHandler}>
                        <FontAwesomeIcon icon={faMagnifyingGlass}/>
                    </button>
                </div>
                {userId !== '' ? (
                    <div className="user-menu-wrapper" ref={dropdownRef}>
                        <FontAwesomeIcon
                            className="user-icon"
                            icon={faCircleUser}
                            onClick={() => setShowDropdown(prev => !prev)}
                        />
                        {showDropdown && (
                            <div className="user-dropdown">
                                <div className="user-id" onClick={() => navigate('/profile')}
                                     style={{cursor: 'pointer'}}>
                                    {userId}
                                </div>
                                <div className="logout" onClick={() => {
                                    signoutHandler();
                                }}>
                                    로그아웃
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="auth-links scrolled-auth-links">
                        <a href="/signin">로그인</a><span className="divider">|</span><a href="/agreement">회원가입</a>
                    </div>
                )}
            </div>
        </nav>
    )
}

export default Navbar