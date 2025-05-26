import React from 'react';
import {useNavigate} from "react-router-dom";
import './Consulting.css';


interface Props {
    userId: string;
}

const Consulting: React.FC<Props> = ({userId}) => {
    const user_sector = "소프트웨어";
    const user_skills = ["컴퓨터활용능력 1급", "정보통신기사"];
    const user_education = "중졸";
    const user_location = "전라북도";

    const navigate = useNavigate();
    return (
    <div className="consulting-container">
      {/* 1) 상단 배너 */}
      <div className="consulting-banner">
        대충 GPT 컨설팅 내용
        {userId !== '' && (
         <div className="consulting-glass-overlay" onClick={()=> navigate("/signin")}>
             로그인 후 해당 공고의 컨설팅을 받아보세요.
         </div>
        )}

      </div>

      <iframe
        className="embedded-site"
        src="https://www.saramin.co.kr/zf_user/jobs/relay/view?rec_idx=12345678"
        frameBorder="0"
        allowFullScreen
        title="채용공고 임베드"
      />

    </div>
    );
};

export default Consulting;
