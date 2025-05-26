const { executeQuery } = require('../Utils/executeDB');


/**
get 사용자 기술
*/
exports.getConsulting = async (req,res) => {
    //TODO: DB에서 데이터 받기
    const APIKEY = process.env.GPT_API_KEY;
    const user_sector = "소프트웨어";
    const user_skills = ["컴퓨터활용능력 1급", "정보통신기사"];
    const user_education = "중졸";
    const user_location = "전라북도";

    const messages = [
        { role: 'system', content: "답변은 항상 한국어로 해주세요." },
        { role: 'user',   content: "f{백엔드 개발자 컨설팅 정보 알려줘.}" }
    ];

    const gptInput = {
        model: 'gpt-3.5-turbo',
        temperature: 0.5,
        messages
    };

    async function CallGPT(input) {
    try {
          const response = await fetch(
            'https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${APIKEY}`
              },
              body: JSON.stringify(input)
            }
          );
          const resultJSON = await response.json();
          return resultJSON.choices[0].message.content;
        } catch (error) {
          console.error('[Error] calling GPT:', error);
          return '';
        }
    }

    // (3) 함수를 호출하고 Await
    const resultContent = await CallGPT(gptInput);

    // (4) resultContent를 JSON으로
    res.status(200).json({ output: resultContent });
};

