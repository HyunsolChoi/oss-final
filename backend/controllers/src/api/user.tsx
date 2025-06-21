// 사용자 정보 수정
export async function updateUserProfile(data: {
    userId: string;
    sector: string;
    education: string;
    region: string;
    skills: string[];
}): Promise<{ success: boolean; message?: string }> {
    try {
        const response = await fetch('/api/user/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        return {
            success: result.success ?? false,
            message: result.message,
        };
    } catch (error) {
        console.error('사용자 정보 수정 요청 실패:', error);
        return { success: false, message: '서버와의 통신 중 오류 발생' };
    }
}

// 사용자 정보 조회
export async function getUserProfile(userId: string): Promise<{
    success: boolean;
    sector?: string;
    education?: string;
    region?: string;
    skills?: string[];
    message?: string;
}> {
    try {
        const response = await fetch(`/api/user/profile?userId=${encodeURIComponent(userId)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const result = await response.json();

        return {
            success: result.success ?? false,
            sector: result.sector,
            education: result.education,
            region: result.region,
            skills: result.skills,
            message: result.message,
        };
    } catch (error) {
        console.error('사용자 정보 조회 요청 실패:', error);
        return { success: false, message: '서버와의 통신 중 오류 발생' };
    }
}