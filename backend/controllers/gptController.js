const { executeTransaction } = require('../Utils/executeDB');

const APIKEY = process.env.OPENAI_API_KEY;

// GET DB에서 user정보
async function getUserInfo(userId){
    try{
        const [userResult, skillsRows, regionRows, educationRows] = await executeTransaction([
                {
                    query: `SELECT sector FROM users WHERE user_id = ?`,
                    params: [userId],
                },
                {
                    query: `
                SELECT s.name
                FROM user_skills us
                JOIN skills s ON us.skill_id = s.skill_id
                WHERE us.user_id = ?
            `,
                    params: [userId],
                },
                {
                    query: `
                SELECT ul.location_name
                FROM user_location_mapping ulm
                JOIN user_locations ul ON ulm.location_id = ul.location_id
                WHERE ulm.user_id = ?
            `,
                    params: [userId],
                },
                {
                    query: `
                SELECT ue.education_name
                FROM user_educations_mapping uem
                JOIN user_educations ue ON uem.user_education_id = ue.user_education_id
                WHERE uem.user_id = ?
            `,
                    params: [userId],
                },
        ]);
        const user = userResult[0];

        if (!user) return res.status(400).json({ success: false, message: '사용자 정보 불러오기 중 에러' });
        const skills = skillsRows.map(r => r.name);
        const regions = regionRows.map(r => r.location_name);
        const educations = educationRows.map(r => r.education_name);

        return [user, skills, regions, educations];
    } catch (err){
        console.error("[ERROR] getUserInfo", err);
        throw err;
    }

}

// CALL GPT 호출 함수
async function callGPT(systemPrompt, userPrompt) {
    // API 요청 body 구성
    const payload = {
        model: "gpt-3.5-turbo",     // 원한다면 "gpt-4" 등으로 변경
        temperature: 0.5,
        max_tokens: 800,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt},
        ],
    };

    try {
        const response = await fetch(
            'https://api.openai.com/v1/chat/completions',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${APIKEY}`,
                },
                body: JSON.stringify(payload),
            }
        );

        //HTTP 상태 코드가 OK(200~299)가 아닐 경우, 에러 던지기
        if (!response.ok) {
          const errBody = await response.text();
          console.error(`[OpenAI API Error] Status: ${response.status}, Body: ${errBody}`);
          return "";
        }

        const resultJSON = await response.json();
        // 디버깅 시 사용
        // console.log('GPT 응답:', resultJSON);

        return resultJSON.choices[0].message.content;
    } catch (error) {
        console.error('[Error] CallGPT:', error);
        return '';
    }
}

// AGENT 채용공고 개요
async function summaryAgent(job) {
  const systemPrompt = `
        너는 채용공고 요약 전문가야.
        아래 JSON 형태의 채용공고 정보를 받고, 아래의 포맷으로 깔끔하게 한국어로 요약해줘.
        1) 직무 분야
        2) 요구 학력
        3) 고용 형태
        3) 근무 지역
    `;

  // JSON을 문자열로 변환하여 프롬프트에 전달
  const userPrompt = `
        {
            jobPostingTItle: ${job.title},
            companyName: ${job.company},
            desireEducation: ${job.education},
            employmentType: ${job.employmentType},
            sector: ${job.sectors}
        }
  `;

  return await callGPT(systemPrompt, userPrompt);
}

// AGENT 사용자 적합도 확인
async function fitAgent(job, sector, skills, regions, educations) {
  const systemPrompt = `
  너는 경력 적합도를 판단하는 컨설팅 전문가야.
    아래 두 JSON을 비교해서,
      1) 사용자와 공고의 기술 매칭 비율(%)
      2) 경력/자격 요건 매칭 여부
      3) 종합 적합도 점수(100점 환산) 및 간략 코멘트
    위 세 항목을 다음의 포멧으로 간단히 답변해줘.
    적합도 등급은 기술, 경력의 매칭 비율을 기준으로 아래를 참고하여 등급만 출력하면 돼.
    A: 매칭 비율 100% ~ 75%,
    B: 매칭 비율 75% ~ 50%,
    C: 매칭 비율 50% ~ 25%,
    D: 매칭 비율 25% ~ 0%
    [답변 방식]
      1) 기술 매칭 비율
      (매칭 비율 내용)
      2) 경력 매칭 비율
      (매칭 비율 내용)
      3) 학력
      (채용 공고에서 요구하는 학력에 맞는지 판단하는 내용)
      4) 지역 매칭
      (희망 지역과 적합한지 판단하는 내용)
      5) 적합도 등급
      (적합도 등급만 출력)
    `;

  const userPrompt = `
    jobInfo = {
        jobPostingTItle: ${job.title},
        companyName: ${job.company},
        desireEducation: ${job.education},
        employmentType: ${job.employmentType},
        sector: ${job.sectors}
    },

    userInfo = {
        desireSector: ${sector}
        education: ${educations.join(', ') || '정보 없음'}
        desireLocation: ${regions.join(', ') || '정보 없음'}
        skills: ${skills.join(', ') || '정보 없음'}
    }
  `;

  return await callGPT(systemPrompt, userPrompt);
}

// AGENT 사용자와 채용 차이 비교
async function gapAgent(job, sector, skills, regions, educations) {
    const systemPrompt = `
        너는 사용자 정보와 채용공고의 내용을 비교하고 각 내용들을 바탕으로 사용자에게 조언을 해주는 컨설팅 전문가야.
        아래 두 JSON을 기반으로, 사용자가 해당 포지션을 준비할 때
          1) 부족한 기술/경험 항목
          2) 자격증/어학 점수 부족 여부
          3) 포트폴리오·프로젝트 경험 부족 요소
        를 리스트 형식으로 뽑아서 한국어로 알려줘.`;

    const userPrompt = `
        jobInfo = {
                jobPostingTItle: ${job.title},
                companyName: ${job.company},
                desireEducation: ${job.education},
                employmentType: ${job.employmentType},
                sector: ${job.sectors}
            },

            userInfo = {
                desireSector: ${sector}
                education: ${educations.join(', ') || '정보 없음'}
                desireLocation: ${regions.join(', ') || '정보 없음'}
                skills: ${skills.join(', ') || '정보 없음'}
            }
      `;



  return await callGPT(systemPrompt, userPrompt);
}

// REQUEST Multi agent 응답
async function reqMultiAgent(sector, skills, regions, educations, job){
    try {
        // 3개 에이전트 동시에 호출
        const [summaryResult, fitResult, gapResult] = await Promise.all([
          summaryAgent(job),
          fitAgent(job, sector, skills, regions, educations),
          gapAgent(job, sector, skills, regions, educations),
        ]);

        return {
          summary: summaryResult,
          fit: fitResult,
          gap: gapResult,
        };
    } catch (err) {
        console.error("[ERROR] reqMultiAgent:", err);
        throw err;
    }
}

// MAIN 컨설팅 함수
exports.getConsultingContext = async (req, res) => {
    const { userId, job } = req.body;

    if (!userId || !job) {
        return res.status(400).json({ success: false, message: 'userId와 job이 필요합니다' });
    }

    try {
        //GET 유저 정보
        const [user, skills, regions, educations] = await getUserInfo(userId);

        //OUTPUT gpt 에이전트 답변들
        const { summary, fit, gap } = await reqMultiAgent(user.sector, skills, regions, educations, job);

        return res.json({
            success: true,
            summary,
            fit,
            gap
        });

    } catch (err) {
        console.error('[ERROR] getConsultingContext:', err.message);
        return '';
    }
}
