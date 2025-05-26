import React from 'react'
import './Consulting.css'

const Consulting: React.FC = () => {

    return (
          <div style={{ width: '100%', height: '600px', overflow: 'hidden', position: 'relative' }}>
                <iframe
                  className="embedded-site"
                  src="https://www.saramin.co.kr/zf_user/jobs/relay/view?rec_idx=12345678"
                  frameBorder="0"
                  allowFullScreen
                  title="채용공고 임베드"
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                  }}
                />
              </div>
    );
}

export default Consulting
