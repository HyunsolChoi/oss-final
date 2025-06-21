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
        - 희망 지역: ${region}

        이 정보를 바탕으로 지원자의 역량과 적합성을 파악할 수 있는 4개의 질문을 만들어주세요.
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


// 컨설팅
exports.getConsultingContext = async (req, res) => {
    const { userId, job } = req.body;

    if (!userId || !job) {
        return res.status(400).json({ success: false, message: 'userId와 공고 정보가 필요합니다' });
    }

    try {
        const [rows] = await executeQuery(
            `SELECT gpt_answer FROM consultations WHERE user_id = ? AND job_posting_id = ?`,
            [userId, job.id]
        );

        const existing = rows?.[0]; // ← 진짜 데이터는 여기
        if (existing?.gpt_answer) {
            console.log("이건 실행되어야함-1");
            const raw = existing.gpt_answer;
            const answer = typeof raw === 'object' ? raw : safeJSONParse(raw);

            if (answer) {
                console.log("이건 실행되어야함-2");
                return res.json({ success: true, answer });
            }
        }


        // console.log("이건 실행되면 안된다 제발");

        const userData = await getUserInfo(userId);
        if (!userData) {
            return res.status(404).json({ success: false, message: '사용자 정보를 찾을 수 없습니다' });
        }

        const [sector, skills, regions, educations, gpt_questions, user_answers] = userData;

        const systemPrompt = `
너는 채용 전문가이자 커리어 컨설턴트다.
목표는 지원자의 이력과 공고의 요구사항, 사전 질문과 답변을 토대로 , 구조화된 피드백을 제공하는 것이다.

내용은 실제 컨설턴트처럼 전문적이고 설득력 있게 작성할 것.
단어 선택은 신중하게 하고, 문장은 간결하지만 풍부하게.
중복 없이 핵심을 짚고 넘어갈 것.

1. 공고의 학력 조건은 다음과 같이 해석한다:
- 고졸↑: 고등학교 졸업 이상 (전문학사, 학사, 석사, 박사 포함)
- 초대졸↑: 전문학사 이상 (학사, 석사, 박사 포함)
- 대졸↑: 학사 이상 (석사, 박사 포함)
- 석사↑: 석사 이상 (박사 포함)
- 박사: 박사 학위 보유자만 가능
- 학력무관: 학력 조건 없음 ( 미입력 이여도 가능 )

2. 사용자의 학력 수준을 위 기준과 비교하여, '조건을 충족하는지' 또는 '학력미달인지' 판단하고 분석에 반영할 것.
사용자의 학력 정보가 없으면 일반 경우로 생각하고 피드백 제공해.

아래의 공고 정보와 지원자 정보를 바탕으로, 구조화된 피드백을 제공해줘.
아래와 같은 JSON 형식으로만 답변할 것. 그 외 텍스트는 절대 포함하지 말 것:

GPT 의 응답은 반드시 아래 JSON 형식 중 하나로 출력해야 합니다.

1. 일반 경우:
{
  "적합성 평가": "공고와 사용자 정보의 일치도, 업무 경험, 기술력 등을 종합적으로 평가한 간결한 한 문단.",
  "강점 분석": "사용자가 해당 공고에 적합한 이유. 예: 보유 기술, 지역 선호, 직무 이해도 등.",
  "지원 전략 제안": "답변 기반으로 면접 전 준비하면 좋을 점 1~2가지. 현실적인 팁으로 제시.",
  "보완점 제안": "부족하거나 개선이 필요한 부분에 대한 조언."
}

2. 직무 혹은 기술과의 관계성이 하나도 없는 경우:
{
  "적합성 평가": "공고와 사용자 정보의 일치도, 업무 경험, 기술력 등을 종합적으로 평가한 간결한 한 문단."
}

**조건:**
- 반드시 JSON 형식의 객체여야 하며, 속성명과 문자열 값은 모두 **쌍따옴표(")** 로 감쌀 것
- 마지막 항목 뒤에 쉼표(,)를 절대 붙이지 마시오
- 형식 오류 없이 JSON.parse() 가능한 결과만 출력할 것
- JSON 외 텍스트나 설명을 포함하지 말 것
        `;

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

[지원자 답변]
${gpt_questions.map((q, i) => `Q${i + 1}. ${q}\nA${i + 1}. ${user_answers[i] || '무응답'}`).join('\n')}
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