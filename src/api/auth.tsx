export async function signin(
    userId: string,
    password: string
): Promise<{ token: string } | false> {
    try {
        const response = await fetch('/api/auth/signin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId, password })
        });

        if (!response.ok) {
            console.error('서버 응답 오류:', response.status);
            return false;
        }

        const result = await response.json();

        if (result.success && result.token) {
            return { token: result.token };
        }

        return false;
    } catch (error) {
        console.error('로그인 요청 실패:', error);
        return false;
    }
}

export async function signout(userId: string): Promise<boolean> {
    try {
        const response = await fetch('/api/auth/signout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });

        if (!response.ok) {
            const { message } = await response.json();
            console.error('로그아웃 실패:', message);
            return false;
        }

        return true;
    } catch (error) {
        console.error('로그아웃 요청 에러:', error);
        return false;
    }
}

// 이메일 인증 요청
export async function requestEmailAuth(email: string): Promise<void> {
    const res = await fetch('/api/emailAuth', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email}),
    })
    if (!res.ok)
        throw new Error('인증 메일 전송 실패')
}

// 이메일 인증 코드 검증
export async function verifyEmailAuth(email: string, code: string): Promise<void> {
    const res = await fetch('/api/emailAuth/verify', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, code}),
    })
    if (!res.ok) {
        const {message} = await res.json()
        throw new Error(message || '인증 실패')
    }
}
