export interface Gpt{
    output: string
}

async function request<T>(path: string): Promise<T> {
    const res = await fetch(path)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json() as Promise<T>
}

export function getConsulting(): Promise<Gpt> {
    return request<Gpt>('/api/gpt/output')
}
