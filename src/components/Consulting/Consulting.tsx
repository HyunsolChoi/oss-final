import React, { useState, useEffect } from 'react';
import {useNavigate, useParams} from "react-router-dom";
import './Consulting.css';
import {getConsulting} from '../../api/gpt';
import {toast} from "react-toastify";
import {getJobInfo} from "../../api/jobs";

interface Props {
    checkToken: () =>  string | undefined;
}

const Consulting: React.FC<Props> = ({checkToken}) => {
    const [gptSummary, setGptSummary] = useState<String>('');
    const [gptFit, setGptFit] = useState<String>('');
    const [gptGap, setGptGap] = useState<String>('');
    const { jobId } = useParams<{ jobId: string }>();
    const [uId, setUId] = useState('');

    const navigate = useNavigate();

    //TODO: UI 정리
    //TODO: 이미지 크롤링
    //TODO: 링크에 따라 iframe 띄우기

    useEffect(() => {
        const validId = checkToken() ?? '';

        if(!validId){
            toast.error("컨설팅 서비스는 로그인 후 사용 가능합니다");
            navigate('/signin');
            return;
        }

        setUId(validId);

        if (!jobId || isNaN(Number(jobId))) {
            toast.error("유효하지 않은 경로");
            navigate('/');
            return;
        }

        (async () => {
            try {
                const job = await getJobInfo(Number(jobId));
                const res = await getConsulting(validId, job);

                if (res.success && res.gptSummary && res.gptFit && res.gptGap) {
                    setGptSummary(res.gptSummary);
                    setGptFit(res.gptFit);
                    setGptGap(res.gptGap);
                } else {
                    toast.error(res.gptFit || '컨설팅 요청 실패');
                }
            } catch (err) {
                console.error(err);
                toast.error('공고 정보를 불러오거나 컨설팅 요청에 실패했습니다');
            }
        })();

    }, [checkToken, jobId, navigate, uId]);

    return (
        <div className="consulting-wrapper">
            <div className="consulting-container">
                <h2 className="consulting-title">📈 적합도 </h2>
                {uId !== '' && (
                    <pre className="consulting-fit">
                        {gptFit}
                    </pre>
                )}
                <h2 className="consulting-title">📜 채용 공고 요약</h2>
                {uId !== '' && (
                    <pre className="consulting-summary">
                        {gptSummary}
                    </pre>
                )}
                <h2 className="consulting-title">📚 채용 공고와 비교</h2>
                {uId !== '' && (
                    <pre className="consulting-gap">
                        {gptGap}
                    </pre>
                )}
            </div>
        </div>
    );
};

export default Consulting;