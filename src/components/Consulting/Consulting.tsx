import React, { useState, useEffect } from 'react';
import {useNavigate} from "react-router-dom";
import './Consulting.css';

import {Gpt, getConsulting} from '../../api/gpt';

interface Props {
    userId: string;
}

const Consulting: React.FC<Props> = ({userId}) => {
    const [gpt, setGpt] = useState<Gpt | null>(null);
    const navigate = useNavigate();

    //TODO: 로그인 했을때만 컨설팅
    //TODO: UI 정리
    //TODO: DB에 따라 추천
    //TODO: 이미지 크롤링
    //TODO: 링크에 따라 iframe 띄우기
    //TODO: 로그인 에러 있음. 로그인 -> 홈으로 해야 로그인 됨.
    //TODO: 페이지 전환되면 로그인 풀림. 왜지??
    useEffect(() => {
             getConsulting()
                  .then(setGpt)
                  .catch(console.error);

    }, [userId]);


    return (
        <div className="consulting-scroll-wrap">
            <div className="consulting-container">
              {/* 1) 상단 배너 */}
              <div className="consulting-banner">
                {gpt !== null ? (
                    <div className="consulting-output">{gpt.output}</div>
                  ) : (
                    <div className="consulting-loading">
                      컨설팅 정보를 불러오는 중…
                    </div>
                  )}
                {userId !== '' && (
                 <div className="consulting-glass-overlay" onClick={()=> navigate("/signin")}>
                     로그인 후 해당 공고의 컨설팅을 받아보세요.
                 </div>
                )}
              </div>

            </div>
            <div className="iframe-wrapper">
              <iframe
                className="embedded-recruitment-site"
                src="https://www.saramin.co.kr/zf_user/jobs/relay/view?rec_idx=12345678"
                frameBorder="0"
                allowFullScreen
                title="채용공고 임베드"
              />
            </div>
        </div>
    );
};

export default Consulting;
