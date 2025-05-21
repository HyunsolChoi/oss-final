// frontend/src/api/jobs.tsx

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
