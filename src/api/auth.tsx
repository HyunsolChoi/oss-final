export async function signin(
    userId: string,
    password: string
): Promise<{ token: string } | { success: false; message: string }> {
    try {
        const response = await fetch('/api/auth/signin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId, password })
        });

        const result = await response.json();

        if (!response.ok) {
            return { success: false, message: result.message || '서버 오류' };
        }

        if (result.success && result.token) {
            return { token: result.token };
        }

        return { success: false, message: result.message || '로그인 실패' };
    } catch (error) {
        return { success: false, message: '요청 실패' };
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

// 이메일 확인 및 아이디 반환 (아이디 찾기)
export async function verifyEmailGetId(email: string, code: string): Promise<string> {
    const res = await fetch('/api/emailAuth/findId', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
    });
    if (!res.ok) {
        const {message} = await res.json()
        throw new Error(message || '인증 실패')
    }
    const data = await res.json();
    return data.message;
}

// 이메일 중복 검사
export async function checkEmailDuplicate(email: string): Promise<boolean> {
    const res = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });

    if (!res.ok) {
        const { message } = await res.json();
        throw new Error(message || '이메일 중복 검사 실패');
    }

    const data = await res.json();
    return data.duplicate === false; // 중복되지 않은 경우만 true 반환
}

// ID 중복검사
export async function checkDuplicateId(userId: string): Promise<boolean> {
    const res = await fetch('/api/auth/check-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
    });

    if (!res.ok) {
        const { message } = await res.json();
        throw new Error(message || '아이디 중복 검사 실패');
    }

    const data = await res.json();
    return data.duplicate === false;
}

// 비밀번호 재설정
export async function resetPassword(userId: string, email: string): Promise<{ success: boolean; message?: string }> {
    const res = await fetch('/api/emailAuth/resetPassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email }),
    })

    if (!res.ok) {
        const { message } = await res.json();
        throw new Error(message || '비밀번호 재설정 실패');
    }

    return await res.json();
}

// 비밀번호 변경
export async function changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
): Promise<{ success: boolean; message?: string }> {
    try {
        const res = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, currentPassword, newPassword }),
        });

        const result = await res.json();

        return {
            success: result.success ?? false,
            message: result.message,
        };
    } catch (error) {
        console.error('비밀번호 변경 요청 에러:', error);
        return { success: false, message: '서버와의 통신 중 오류 발생' };
    }
}

// 회원가입
export async function signup(data: {
    userId: string;
    email: string;
    password: string;
    sector: string;
    education: string;
    region: string;
    skills: string[];
    questions?: string[];
    answers?: string[];
}): Promise<{ success: boolean; message?: string }> {
    try {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
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
        console.error('회원가입 요청 실패:', error);
        return { success: false, message: '서버와의 통신 중 오류 발생' };
    }
}