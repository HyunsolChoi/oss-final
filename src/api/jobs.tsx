export interface Job {
    id: number
    company: string
    title: string
    link: string
    location?: string
    experience?: string
    education?: string
    employmentType?: string
    salary?: string
    views?: number
    sector?: string
    deadline: string
}

async function request<T>(path: string): Promise<T> {
    const res = await fetch(path)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json() as Promise<T>
}

export function getLatestJobs(): Promise<Job[]> {
    return request<Job[]>('/api/jobs/latest')
}

export function getTop100Jobs(): Promise<Job[]> {
    return request<Job[]>('/api/jobs/top100')
}

export function getEntryLevelJobs(): Promise<Job[]> {
    return request<Job[]>('/api/jobs/entry')
}

// 이메일 인증 요청
export function requestEmailAuth(email: string): Promise<void> {
    return fetch('/api/emailAuth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    }).then(res => {
        if (!res.ok) throw new Error('인증 메일 전송 실패');
    });
}

// 이메일 인증 코드 검증
export function verifyEmailAuth(email: string, code: string): Promise<void> {
    return fetch('/api/emailAuth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
    }).then(async res => {
        if (!res.ok) {
            const { message } = await res.json();
            throw new Error(message || '인증 실패');
        }
    });
}

