import {Job} from "./jobs";

// 즐겨찾기 여부 확인
export async function isBookmarked(userId: string, jobId: number): Promise<boolean> {
    const params = new URLSearchParams({ userId, jobId: String(jobId) });

    const res = await fetch(`/api/bookmark/check?${params.toString()}`, {
        method: 'GET',
    });

    if (!res.ok) {
        throw new Error('즐겨찾기 여부 조회 실패');
    }

    const result = await res.json();
    return result.bookmarked;
}

// 즐겨찾기 토글 요청
export async function toggleBookmark(userId: string, jobId: number): Promise<{ bookmarked: boolean }> {
    const res = await fetch('/api/bookmark/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, jobId }),
    });

    if (!res.ok) {
        throw new Error('즐겨찾기 토글 요청 실패');
    }

    return await res.json(); // { success: true, bookmarked: true/false }
}

// bookmark 요청
export async function getBookmarkedJobs(userId: string): Promise<Job[]> {
    const params = new URLSearchParams({ userId });

    const res = await fetch(`/api/bookmark/get?${params.toString()}`, {
        method: 'GET',
    });

    if (!res.ok) {
        throw new Error('즐겨찾기 공고 조회 실패');
    }

    const result = await res.json();

    if (!result.success || !result.jobs) {
        throw new Error(result.message || '공고 정보를 찾을 수 없습니다');
    }

    return result.jobs as Job[];
}

// 즐겨찾기 삭제 요청
export async function deleteBookmarks(userId: string, jobIds: number[]): Promise<void> {
    const res = await fetch('/api/bookmark/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, jobIds }),
    });

    if (!res.ok) {
        throw new Error('즐겨찾기 삭제 요청 실패');
    }

    const result = await res.json();

    if (!result.success) {
        throw new Error(result.message || '즐겨찾기 삭제 실패');
    }
}

