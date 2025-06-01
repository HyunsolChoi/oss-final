import { Job } from './jobs'

// 컨설팅 정보 요청
export async function getConsulting(userId: string, job: Job): Promise<{
    success: boolean;
    gptSummary?: string;
    gptFit?: string;
    gptGap?: string;
    message?: string;
}> {
    try {
        const response = await fetch('/api/gpt/consulting', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, job })
        });

        const result = await response.json();

        return {
            success: result.success,
            gptSummary: result.summary,
            gptFit: result.fit,
            gptGap: result.gap,
            message: result.message
        };
    } catch (error) {
        console.error('컨설팅 요청 실패:', error);
        return { success: false, message: '서버와의 통신 중 오류 발생'};
    }
}

// GPT 질문 생성 요청
export async function generateQuestions(data: {
    job: string;
    skills: string[];
    education: string;
    region: string;
}): Promise<{ success: boolean; questions?: string[]; message?: string }> {
    try {
        const response = await fetch('/api/gpt/generate-questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        return {
            success: result.success,
            questions: result.questions,
            message: result.message
        };
    } catch (error) {
        console.error('질문 생성 요청 실패:', error);
        return { success: false, message: '서버와의 통신 중 오류 발생' };
    }
}

// 질문과 답변 저장
export async function saveQuestionsAndAnswers(data: {
    userId: string;
    questions: string[];
    answers: string[];
}): Promise<{ success: boolean; message?: string }> {
    try {
        const response = await fetch('/api/gpt/save-qa', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        return {
            success: result.success,
            message: result.message
        };
    } catch (error) {
        console.error('질문/답변 저장 요청 실패:', error);
        return { success: false, message: '서버와의 통신 중 오류 발생' };
    }
}