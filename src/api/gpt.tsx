import { Job } from './jobs'

// 컨설팅 정보 요청
export async function getConsulting(userId: string, job: Job): Promise<{
    success: boolean;
    gptOutput?: string;
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
            gptOutput: result.gptOutput,
            message: result.message,
        };
    } catch (error) {
        console.error('컨설팅 요청 실패:', error);
        return { success: false, message: '서버와의 통신 중 오류 발생' };
    }
}
