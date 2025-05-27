const { executeTransaction } = require('../Utils/executeDB');

const APIKEY = process.env.OPENAI_API_KEY;

// GPT 호출 함수
async function CallGPT(input) {
    try {
        const response = await fetch(
            'https://api.openai.com/v1/chat/completions',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${APIKEY}`,
                },
                body: JSON.stringify(input),
            }
        );

        const resultJSON = await response.json();
        // 디버깅 시 사용
        // console.log('GPT 응답:', resultJSON);

        return resultJSON.choices[0].message.content;
    } catch (error) {
        console.error('[Error] calling GPT:', error);
        return '';
    }
}

exports.getConsultingContext = async (req, res) => {
    const { userId, job } = req.body;

    if (!userId || !job) {
        return res.status(400).json({ success: false, message: 'userId와 job이 필요합니다' });
    }

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
        if (!user) return res.status(400).json({ success: false, message: '사용자 정보 불러오기 중 에러' });
        const skills = skillsRows.map(r => r.name);
        const regions = regionRows.map(r => r.location_name);
        const educations = educationRows.map(r => r.education_name);

        const messages = [
            {
                role: 'system',
                content: '너는 구직자에게 채용공고와 이력서를 비교해 직무 적합도 컨설팅을 제공하는 전문가야. 분석은 한국어로 하고, 객관적으로 조언해야 해.'
            },
            {
                role: 'user',
                content: `
[채용공고]
- 제목: ${job.title}
- 회사명: ${job.company}
- 마감일: ${job.deadline}
- 지역: ${job.location}
- 요구학력: ${job.education}
- 고용형태: ${job.employmentType}
- 직무분야: ${job.sectors}

[사용자 이력 정보]
- 희망직무: ${user.sector}
- 학력: ${educations.join(', ') || '정보 없음'}
- 근무희망지역: ${regions.join(', ') || '정보 없음'}
- 기술 스킬(자격증 등): ${skills.join(', ') || '정보 없음'}

이 사용자가 해당 공고에 지원한다고 가정했을 때 적합성, 장점, 보완점, 추천 여부 등을 평가해줘. 
답변은 반드시 아래 정해진 형식을 따르며, 서론이나 요약 없이 각 항목만 명확하게 작성해.

※ 학력 비교 기준은 반드시 다음을 따르며, 사용자의 학력이 요구 학력보다 높거나 같으면 "요구 학력을 충족함"으로 판단해야 해.
학력 비교 우선순위: 중졸 < 고졸 < 학사 < 석사 < 박사

※ 한국의 2024~2025년 취업 시장 상황을 반영해 평가할 것.

1. 적합성 평가 
2. 약점 또는 개선점
3. 커리어 설계 및 방향 제시
4. 종합 코멘트 및 추천 여부

                `
            }
        ];

        const gptInput = {
            model: 'gpt-3.5-turbo',
            temperature: 0.5,
            messages,
        };

        const gptOutput = await CallGPT(gptInput);

        return res.json({
            success: true,
            gptOutput,
        });

    } catch (err) {
        console.error('[getConsultingContext 오류]:', err.message);
        return '';
    }
}
