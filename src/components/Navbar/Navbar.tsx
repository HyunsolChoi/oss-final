// src/components/Navbar.tsx
import React, {useEffect, useState} from 'react'
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleUser, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import './Navbar.css'

interface Props {
    userId: string;
    activeTab: 'Top100' | 'Entry' | 'MyJob';
    setActiveTab: (tab: 'Top100' | 'Entry' | 'MyJob') => void;
}

const Navbar: React.FC<Props> = ({ userId, activeTab, setActiveTab }) => {
    const [scrolled, setScrolled] = useState(false);
    const [placeholder, setPlaceholder] = useState('검색어를 입력하세요');

    const navigate = useNavigate();

    // const logout = () => {
    //     // 토큰 삭제 등 로그아웃 처리
    // }

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY >= 490);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);


    const searchHandler = ( isClick: boolean ) => {
        if(isClick)
            setPlaceholder("기업명, 키워드, 직무를 검색해보세요")
        else
            setPlaceholder("검색어를 입력하세요");
    }

    const activeTabHandler = (menu: 1 | 2 | 3) => {
        let newTab: 'Top100' | 'Entry' | 'MyJob';
        if (menu === 1) {
            newTab = 'Top100';
        } else if (menu === 2) {
            newTab = 'Entry';
        } else {
            newTab = 'MyJob';
        }
        if (activeTab !== newTab) {
            setActiveTab(newTab);
        }
        window.scrollTo({ top: 515, behavior: 'smooth' });
    };

    return (
        <nav className="navbar-wrapper">
            <div className="navbar">
                <div className="navbar-logo" onClick={() => navigate('/')}>CareerFit</div>
                <ul className={`navbar-links ${scrolled ? 'scrolled' : ''}`}>
                    <li>
                        <a
                            href="#"
                            className={scrolled && activeTab === 'Top100' ? 'scrolled-active' : ''}
                            onClick={(e) => {
                                e.preventDefault();
                                activeTabHandler(1);
                            }}
                        >
                            Top100
                        </a>
                    </li>
                    <li>
                        <a
                            href="#"
                            className={scrolled && activeTab === 'Entry' ? 'scrolled-active' : ''}
                            onClick={(e) => {
                                e.preventDefault();
                                activeTabHandler(2);
                            }}
                        >
                            신입
                        </a>
                    </li>
                    <li>
                        <a
                            href="#"
                            className={scrolled && activeTab === 'MyJob' ? 'scrolled-active' : ''}
                            onClick={(e) => {
                                e.preventDefault();
                                activeTabHandler(2);
                            }}
                        >
                            나의 직무
                        </a>
                    </li>
                </ul>
                <div className={`search-container ${scrolled ? 'scrolled' : ''}`}>
                    <input type="text" placeholder={placeholder}
                           onClick={() => searchHandler(true)}
                           onBlur={() => searchHandler(false)}/>
                    <button className="search-button">
                        <FontAwesomeIcon icon={faMagnifyingGlass}/>
                    </button>
                </div>
                {userId !== '' ? (
                    <FontAwesomeIcon className="user-icon" icon={faCircleUser} />
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
