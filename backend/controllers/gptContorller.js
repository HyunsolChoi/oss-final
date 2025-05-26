const { executeQuery } = require('../Utils/executeDB');


/**
get 사용자 기술
*/
exports.getConsulting = async (req,res) => {
//    const messages = [
//    	{ role: 'system', content: "답변은 항상 한국어로 해주세요."}
//    	{ role: 'user', content: "백엔드 개발자 컨설팅 정보 알려줘."}
//        ]
//
//    const gptInput = {
//            model: 'gpt-3.5-turbo',
//            temperature: 0.5,
//            messages: messages,
//          }

    const user_sector = "소프트웨어";
    const user_skills = ["컴퓨터활용능력 1급", "정보통신기사"];
    const user_education = "중졸";
    const user_location = "전라북도";

    res.status(200).json({ output: "빵이예요~" });
};

