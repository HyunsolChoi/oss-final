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
    sectors?: string
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

export async function getMyJobs(userId: string): Promise<Job[]> {
    const res = await fetch('/api/jobs/myjobs', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({userId}),
    })
    if (!res.ok)
        throw new Error('내 직무 공고 조회에 실패했습니다')
    return (await res.json() as Promise<Job[]>)
}



