const { executeQuery, executeTransaction } = require('../Utils/executeDB');

const APIKEY = process.env.OPENAI_API_KEY;

// GET DB에서 user정보
async function getUserInfo(userId){
    try{
        const [user_sector, skillsRows, regionRows, educationRows, gptRows] = await executeTransaction([
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
            {
                query: `
                          SELECT ug.gpt_question, ug.user_answer
                          FROM user_gpt ug
                          WHERE ug.user_id = ?
                    `,
                params: [userId],
            }
        ]);
        const sector = user_sector[0];

        if (!sector) return null;
        const skills = skillsRows.map(r => r.name);
        const regions = regionRows.map(r => r.location_name);
        const educations = educationRows.map(r => r.education_name);
        const gpt_questions = gptRows.map(r => r.gpt_question);
        const user_answers = gptRows.map(r => r.user_answer);

        return [sector, skills, regions, educations, gpt_questions, user_answers];
    } catch (err){
        console.error("[ERROR] getUserInfo", err);
        throw err;
    }

}

// CALL GPT 호출 함수
async function callGPT(systemPrompt, userPrompt) {
    // API 요청 body 구성
    const payload = {
        model: "gpt-3.5-turbo",
        temperature: 0.2,
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

        return resultJSON.choices[0].message.content.trim();
    } catch (error) {
        console.error('[Error] CallGPT:', error);
        return '';
    }
}

// GPT 질문 생성 함수
async function generateQuestions(job, skills, education, region) {
    const systemPrompt = `
        너는 채용 면접관이자 커리어 컨설턴트야.
        지원자의 정보를 바탕으로 그들의 역량과 목표를 파악하기 위한 4개의 질문을 만들어줘.

        질문 조건:
        1. 각 질문은 지원자의 배경과 관련이 있어야 함
        2. 개인의 강점, 목표, 경험, 발전 가능성을 파악할 수 있는 질문
        3. 너무 개인적이거나 불편한 질문은 피할 것
        4. 각 질문은 간결하고 명확해야 함

        반드시 다음 JSON 형식으로만 응답해줘:
        {
            "questions": [
                "질문1",
                "질문2",
                "질문3",
                "질문4"
            ]
        }
    `;

    const userPrompt = `
        지원자 정보:
        - 희망 직무: ${job}
        - 보유 기술: ${skills.join(', ')}
        - 학력: ${education}

        이 정보를 바탕으로 지원자의 역량과 적합성을 파악할 수 있는 4개의 질문을 만들어라.
    `;

    try {
        const response = await callGPT(systemPrompt, userPrompt);
        const parsed = JSON.parse(response);
        return parsed.questions || [];
    } catch (error) {
        console.error('질문 생성 파싱 오류:', error);
        // 파싱 실패 시 기본 질문 반환
        return [
            `${job} 직무를 선택하게 된 계기는 무엇인가요?`,
            `본인의 강점 중 ${job} 직무에 가장 도움이 될 것은 무엇인가요?`,
            `향후 3년 내 달성하고 싶은 커리어 목표는 무엇인가요?`,
            `${job} 분야에서 가장 관심 있는 기술이나 트렌드는 무엇인가요?`
        ];
    }
}

function safeJSONParse(str) {
    try {
        return JSON.parse(str);
    } catch (err) {
        try {
            const fixed = str
                .replace(/([{,])\s*([a-zA-Z가-힣0-9_]+)\s*:/g, '$1 "$2":') // key에 쌍따옴표
                .replace(/,(\s*[}\]])/g, '$1'); // 마지막 쉼표 제거
            return JSON.parse(fixed);
        } catch (e2) {
            console.error('[safeJSONParse 실패]', e2);
            return null;
        }
    }
}

async function isUserSuitableForJob(userId, job, sector, skills, regions, gpt_questions, user_answers) {
    const systemPrompt = `
너는 채용 전문가이자 커리어 컨설턴트다.  
지원자의 정보와 채용 공고의 조건을 바탕으로 해당 직무에 적합한지 여부만 판단해라.

[판단 기준]
- 경력 조건 부합 여부
- 기술 보유 여부 (공고 직무 관련성)
- 희망 직무 vs 공고 직무의 일치성
- 사용자의 스킬이 부족하더라도 희망 직무의 적합도가 높다면 반드시 true를 반환한다.

❗절대 유의사항:
- 지역 때문에 부적합하다고 판단하면 그건 오답이다.

[응답 규칙]
- 적합하다고 판단되면 "true"
- 적합하지 않으면 "false"
- 다른 말 없이 "true" 또는 "false"만 반환 (소문자, 따옴표 없음)
`;

    const userPrompt = `
[공고 정보]
- 회사: ${job.company}
- 직무명: ${job.title}
- 근무지: ${job.location}
- 경력 조건: ${job.experience}
- 고용 형태: ${job.employmentType}
- 직무 분야: ${job.sectors}
- 마감일: ${job.deadline}

[사용자 정보]
- 희망 직무: ${sector?.sector || '미기재'}
- 보유 기술: ${skills.length ? skills.join(', ') : '없음'}

[지원자 답변]
${gpt_questions.map((q, i) => `Q${i + 1}. ${q}\nA${i + 1}. ${user_answers[i] || '무응답'}`).join('\n')}
`;

    const result = await callGPT(systemPrompt, userPrompt);

    if (typeof result === 'string') {
        const trimmed = result.trim().toLowerCase();
        if (trimmed === 'true') return true;
        if (trimmed === 'false') return false;
    }

    console.warn('[경고] GPT 응답이 true/false 형식이 아님:', result);
    return false; // default
}

// 컨설팅
exports.getConsultingContext = async (req, res) => {
    const { userId, job, isRetry } = req.body;

    if (!userId || !job) {
        return res.status(400).json({ success: false, message: 'userId와 공고 정보가 필요합니다' });
    }

    try {
        // 갱신 요청이 아닌 경우에만 기존 컨설팅 여부 확인
        if(!isRetry){
            const [rows] = await executeQuery(
                `SELECT gpt_answer FROM consultations WHERE user_id = ? AND job_posting_id = ?`,
                [userId, job.id]
            );

            const existing = rows?.[0];
            if (existing?.gpt_answer) {
                const raw = existing.gpt_answer;
                const answer = typeof raw === 'object' ? raw : safeJSONParse(raw);

                if (answer) {
                    return res.json({ success: true, answer });
                }
            }
        }

        const userData = await getUserInfo(userId);
        if (!userData) {
            return res.status(404).json({ success: false, message: '사용자 정보를 찾을 수 없습니다' });
        }

        const [sector, skills, regions, educations, gpt_questions, user_answers] = userData;

        const isSuitable = await isUserSuitableForJob(
            userId, job, sector, skills, regions, gpt_questions, user_answers
        );

        const systemPrompt = `
너는 채용 전문가이자 커리어 컨설턴트다.  
목표는 지원자의 이력과 공고의 요구사항, 사전 질문과 답변을 바탕으로 **현실적이고 전략적인 피드백**을 제공하는 것이다.

[피드백 작성 규칙]
1. 공고와 지원자의 정보를 **비교·분석하여 적합성 여부**를 판단하고, 그 근거를 논리적으로 작성한다.
2. 피드백은 긍정/부정 여부와 상관없이, **지원자에게 도움이 되도록 현실적이고 실질적인 조언**을 포함해야 한다.
3. 전략 제안은 **지원자가 면접 또는 서류에서 어떻게 표현해야 유리한지 구체적으로** 알려줘야 한다.
4. 보완점 제안은 **피상적인 말 대신 실제로 무엇을 개선하거나 준비하면 좋은지 명확하게** 작성한다.
5. 피드백은 홍보 문구처럼 포장하지 말고, **구체적 데이터 기반으로 냉정하고 명확하게** 작성하라.
6. 선호 지역은 컨설팅 상에서 중요한 정보가 아니다. 피드백은 실질적인 직무 위주로 진행하라.
7. 근무지가 선호 지역과 다른 경우 선호 지역 언급 하지마라.
8. 무조건 JSON 형식으로만 응답하고, 주석이나 설명, 기타 텍스트는 포함하지 마라.

[학력 조건 해석 기준]
공고 내 학력 조건은 다음과 같이 해석하고, 사용자의 학력과 비교하여 조건 충족 여부를 논리적으로 판단할 것.
- 고졸↑: 고등학교 졸업 이상 (전문학사, 학사, 석사, 박사 포함)
- 초대졸↑: 전문학사 이상 (학사, 석사, 박사 포함)
- 대졸↑: 학사 이상 (석사, 박사 포함)
- 석사↑: 석사 이상 (박사 포함)
- 박사: 박사만 가능
- 학력무관: 학력 조건 없음 (입력되지 않아도 무관)

사용자 학력이 명시되지 않은 경우, 학력 조건에 관계없이 일반적인 경우로 간주하여 피드백을 제공할 것.

[피드백 출력 형식]
GPT는 반드시 아래 둘 중 하나의 JSON 형식으로 응답해야 한다.  
**그 외 텍스트, 설명, 주석 등은 절대 포함하지 말 것.**  
출력 결과는 반드시 JSON.parse() 가능한 유효한 형식이어야 하며, 속성명과 값은 모두 쌍따옴표(")로 감쌀 것.  
각 항목 사이에는 쉼표(,)를 사용하되, 마지막 항목 뒤에는 쉼표를 사용하지 말 것.

[출력 형식 결정 조건]
- 아래에 주어지는 isSuitable 값이 true면 → 형식 1번으로 작성
- false면 → 형식 2번으로 작성

1. 하단 isSuitable값이 true인 경우:
- 아래 네 항목은 **무조건 모두 포함** 되어야 한다.
- 절대로, 반드시 누락해서는 안된다.
{
  "적합성 평가": "공고와 사용자 정보의 일치도, 업무 경험, 기술력 등을 바탕으로 적합성을 간결하고 논리적으로 평가한 한 문단.",
  "강점 분석": "해당 공고에 지원자가 적합한 구체적인 이유. 보유 기술, 경력, 직무 이해도, 지역 선호 등 포함.",
  "지원 전략 제안": "실질적인 면접 또는 서류 준비 팁 1~2가지. 강점을 기반으로 한 전략 위주로 작성.",
  "보완점 제안": "공고 대비 부족한 부분에 대해 현실적인 개선 방향 제시. 단, 근거 없는 추정은 하지 말 것."
}

2. 하단 isSuitable값이 false인 경우:

❗중요: isSuitable이 false인 경우에는 반드시 아래 형식만 응답할 것.
{
  "적합성 평가": "사용자의 희망 직무, 기술, 경력 등이 공고의 직무와 명확히 맞지 않아 적합성이 낮은 이유를 논리적으로 서술한 한 문단."
}
이외 항목(강점 분석, 지원 전략 제안, 보완점 제안)은 절대 포함하지 마라.
응답은 JSON만 포함하고, 다른 텍스트는 쓰지 마라.
`

        const userPrompt = `
[공고 정보]
- 회사: ${job.company}
- 직무명: ${job.title}
- 근무지: ${job.location}
- 경력 조건: ${job.experience}
- 학력 조건: ${job.education}
- 고용 형태: ${job.employmentType}
- 직무 분야: ${job.sectors}
- 마감일: ${job.deadline}

[사용자 정보]
- 희망 직무: ${sector?.sector || '미기재'}
- 보유 기술: ${skills.length ? skills.join(', ') : '없음'}
- 선호 지역: ${regions.length ? regions.join(', ') : '없음'}
- 학력: ${educations.length ? educations.join(', ') : '없음'}

! 중요 : 선호 지역과 근무지가 다른건 문제가 되지 않으니 제발 실질적인 평가만해라. 선호 지역은 단순히 참고 사항이다.

[지원자 답변]
${gpt_questions.map((q, i) => `Q${i + 1}. ${q}\nA${i + 1}. ${user_answers[i] || '무응답'}`).join('\n')}

[시스템 판단]
- isSuitable: ${isSuitable ? 'true' : 'false'}
        `;

        const rawAnswer = await callGPT(systemPrompt, userPrompt);


        await executeQuery(
            `REPLACE INTO consultations (user_id, job_posting_id, gpt_answer) VALUES (?, ?, ?)`,
            [userId, job.id, JSON.stringify(rawAnswer)]
        );

        return res.json({ success: true, answer: rawAnswer });

    } catch (err) {
        console.error('[ERROR] getConsultingContext:', err);
        return res.status(500).json({
            success: false,
            message: 'GPT 응답 생성 중 오류가 발생했습니다',
        });
    }
};


// 질문 생성 API
exports.generateGPTQuestions = async (req, res) => {
    const { job, skills, education, region } = req.body;

    if (!job || !skills || !education || !region) {
        return res.status(400).json({
            success: false,
            message: '모든 정보가 필요합니다'
        });
    }

    try {
        const questions = await generateQuestions(job, skills, education, region);

        return res.json({
            success: true,
            questions
        });
    } catch (error) {
        console.error('GPT 질문 생성 오류:', error);
        return res.status(500).json({
            success: false,
            message: '질문 생성 중 오류가 발생했습니다'
        });
    }
};

// 키워드 생성 및 저장
exports.processUserKeywords = async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ success: false, message: 'userId가 필요합니다' });
    }

    try {
        // 기본 유저 정보
        const userData = await getUserInfo(userId);

        if (!userData) {
            return res.status(404).json({ success: false, message: '사용자 정보를 찾을 수 없습니다' });
        }

        const [sector, skills] = userData;

        // 즐겨찾기 공고의 직무 정보 수집
        const [rows] = await executeQuery(
            `
            SELECT DISTINCT s.sector_name
            FROM bookmarks b
            JOIN job_posting_sectors jps ON b.job_posting_id = jps.job_posting_id
            JOIN sectors s ON jps.sector_id = s.sector_id
            WHERE b.user_id = ?
            `,
            [userId]
        );
        const bookmarkedSectors = rows.map(r => r.sector_name);

        // GPT 프롬프트 구성
        const systemPrompt = `
        너는 커리어 분석 전문가이다.  
        지원자의 직무와 기술 스택, 즐겨찾은 채용공고 직무를 기반으로 직무 관련 키워드 5개를 선정해라.
        
        [조건]
        - 모든 키워드는 공백 없이 하나의 단어로 구성되어야 함 (예: "백엔드", "Java", "DB", "회계", "인사" 등)
        - 반드시 직무 또는 기술과 관련 있는 핵심 키워드여야 함
        - 키워드는 추상적이지 않고 구체적이어야 함 (예: "개발", "기술" 금지)
        - 아래 JSON 형식으로만 응답하라. 다른 설명, 주석 포함 금지.
        
        [응답 형식]
        {
          "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"]
        }
        `.trim();

        const userPrompt = `
        지원자 정보:
        - 희망 직무: ${sector?.sector || '미기재'}
        - 보유 기술: ${skills.length ? skills.join(', ') : '없음'}
        - 즐겨찾은 직무 분야: ${bookmarkedSectors.length ? bookmarkedSectors.join(', ') : '없음'}
        `.trim();

        const raw = await callGPT(systemPrompt, userPrompt);
        const parsed = safeJSONParse(raw);

        if (!parsed || !Array.isArray(parsed.keywords) || parsed.keywords.length !== 5) {
            return res.status(500).json({ success: false, message: '키워드 생성 실패' });
        }

        const keywords = parsed.keywords;

        await executeQuery(
            `UPDATE users SET keywords = ? WHERE user_id = ?`,
            [JSON.stringify(keywords), userId]
        );

        return res.json({ success: true, keywords });
    } catch (err) {
        console.error('[ERROR] processUserKeywords:', err);
        return res.status(500).json({ success: false, message: '서버 오류' });
    }
};


// 질문과 답변 저장 API => 혹시라도 질문 더 많다는 기능 추가로 활용 가능
exports.saveQuestionsAndAnswers = async (req, res) => {
    const { userId, questions, answers } = req.body;

    if (!userId || !questions || !answers || questions.length !== answers.length) {
        return res.status(400).json({
            success: false,
            message: '유효하지 않은 데이터입니다'
        });
    }

    try {
        // 각 질문과 답변을 저장
        const queries = [];
        for (let i = 0; i < questions.length; i++) {
            // 질문 저장
            if(questions[i].trim() && answers[i].trim()){
                queries.push({
                    query: `INSERT INTO user_gpt (user_id, gpt_question, user_answers) VALUES (?, ?, ?)`,
                    params: [userId, questions[i].trim(), answers[i].trim()]
                });
            }
        }

        // 답변 저장
        if (queries.length > 0) {
            await executeTransaction(queries);
        }

        return res.json({
            success: true,
            message: '질문과 답변이 저장되었습니다'
        });
    } catch (error) {
        console.error('질문/답변 저장 오류:', error);
        return res.status(500).json({
            success: false,
            message: '저장 중 오류가 발생했습니다'
        });
    }
};

