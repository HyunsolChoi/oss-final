const { executeTransaction } = require('../Utils/executeDB');

const APIKEY = process.env.OPENAI_API_KEY;

// GET DB에서 user정보
async function getUserInfo(userId) {
  try {
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
    if (!user) {
      throw new Error('사용자 정보를 찾을 수 없습니다.');
    }

    const skills = skillsRows.map(r => r.name);
    const regions = regionRows.map(r => r.location_name);
    const educations = educationRows.map(r => r.education_name);

    return [user, skills, regions, educations];
  } catch (err) {
    console.error('[ERROR] getUserInfo', err);
    throw err;
  }
}

// CALL GPT 호출 함수
async function callGPT(systemPrompt, userPrompt) {
  const payload = {
    model: 'gpt-3.5-turbo',   // 필요에 따라 'gpt-4'로 변경 가능
    temperature: 0.5,
    max_tokens: 800,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  };

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${APIKEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error(`[OpenAI API Error] Status: ${response.status}, Body: ${errBody}`);
      return '';
    }

    const resultJSON = await response.json();
    return resultJSON.choices[0].message.content;
  } catch (error) {
    console.error('[Error] callGPT:', error);
    return '';
  }
}

// AGENT 채용공고 개요
async function summaryAgent(job) {
  const systemPrompt = `
        너는 채용공고 요약 전문가야.
        아래 JSON 형식의 jobInfo 객체를 받아서, 반드시 다음 순서와 형식으로 한국어 요약을 작성해줘:

        [요약 형식]
        1) 직무 분야: (채용공고에서 직무 분야)
        2) 요구 학력: (채용공고에서 요구하는 학력)
        3) 고용 형태: (채용공고에서 명시된 정규직/계약직 등)
        4) 근무 지역: (채용공고에 나오는 근무 지역)

        각 항목 앞에 번호와 제목을 붙이고, 간결하고 핵심 위주로 기술해줘.
    `;

  const userPrompt = `
        {
          "jobInfo": ${JSON.stringify({
            jobPostingTitle: job.title,
            companyName: job.company,
            desireEducation: job.education,
            employmentType: job.employmentType,
            sector: job.sectors,
          }, null, 2)}
        }
    `;

  return await callGPT(systemPrompt.trim(), userPrompt.trim());
}

// AGENT 사용자 적합도 확인
async function fitAgent(job, sector, skills, regions, educations) {
  const systemPrompt = `
        너는 경력 적합도를 판단하는 컨설팅 전문가야.
        아래 JSON 두 개(jobInfo, userInfo)를 비교해서, 반드시 다음 순서와 형식으로 결과만 마크다운 형식으로 출력해줘.
        그리고 매핑 비율은 어떤 기준으로 선정되었는지도 등급출력한 후 설명해줘.


        [출력 형식]
        1) 기술 매칭 비율: (예: 80%)
        2) 경력 매칭 비율: (예: 70%)
        3) 학력 적합 여부: (예: 적합 / 부적합)
        4) 지역 적합 여부: (예: 적합 / 부적합)
        5) 최종 적합도 등급: (A / B / C / D)

        (매칭 선정 기준 출력)

        ※ 적합도 등급 기준 (기술+경력 매칭 비율 평균)
        - A: 75% 이상
        - B: 50% 이상 ~ 75% 미만
        - C: 25% 이상 ~ 50% 미만
        - D: 25% 미만
    `;

  const userPrompt = `
        {
          "jobInfo": ${JSON.stringify({
            jobPostingTitle: job.title,
            companyName: job.company,
            desireEducation: job.education,
            employmentType: job.employmentType,
            sector: job.sectors,
          }, null, 2)},
          "userInfo": ${JSON.stringify({
            desireSector: sector,
            educationLevels: educations,
            preferredLocations: regions,
            skills: skills
          }, null, 2)}
        }
    `;

  return await callGPT(systemPrompt.trim(), userPrompt.trim());
}

// AGENT 사용자와 채용 차이 비교
async function gapAgent(job, sector, skills, regions, educations) {
  const systemPrompt = `
        너는 사용자 정보와 채용공고 정보를 바탕으로, 사용자가 해당 포지션을 준비하기 위해 필요한 조언을 제공하는 커리어 코치야.
        아래 JSON 두 개(jobInfo, userInfo)를 비교하고, 반드시 리스트 형식(“- ”로 시작)으로 다음 항목을 한국어로 출력해줘:

        1) 부족한 기술/경험 항목
        2) 필요한 자격증/어학 점수
        3) 추천하는 포트폴리오·프로젝트 경험

        출력 예시:
        - 부족한 기술/경험 항목: JavaScript 프레임워크 경험 부족
        - 필요한 자격증/어학 점수: 토익 800점 이상
        - 추천 프로젝트: 간단한 개인 웹앱 포트폴리오 제작
    `;

  const userPrompt = `
        {
          "jobInfo": ${JSON.stringify({
            jobPostingTitle: job.title,
            companyName: job.company,
            desireEducation: job.education,
            employmentType: job.employmentType,
            sector: job.sectors,
          }, null, 2)},
          "userInfo": ${JSON.stringify({
            desireSector: sector,
            educationLevels: educations,
            preferredLocations: regions,
            skills: skills
          }, null, 2)}
        }
    `;

  return await callGPT(systemPrompt.trim(), userPrompt.trim());
}

// REQUEST Multi agent 응답
async function reqMultiAgent(sector, skills, regions, educations, job) {
  try {
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
    console.error('[ERROR] reqMultiAgent:', err);
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
    // GET 유저 정보
    const [user, skills, regions, educations] = await getUserInfo(userId);

    // 출력: GPT 에이전트 답변들
    const { summary, fit, gap } = await reqMultiAgent(
      user.sector,
      skills,
      regions,
      educations,
      job
    );

    return res.json({
      success: true,
      summary,
      fit,
      gap,
    });
  } catch (err) {
    console.error('[ERROR] getConsultingContext:', err.message);
    return res.status(500).json({ success: false, message: '서버 에러가 발생했습니다' });
  }
};
