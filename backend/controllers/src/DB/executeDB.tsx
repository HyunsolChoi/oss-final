import { getConnection } from './connectDB';

export async function executeQuery(query: string, params: any[]) {
    const conn = await getConnection();
    try {
        const [rows] = await conn.query(query, params);
        return rows;
    } finally {
        await conn.end();
    }
}

export async function executeTransaction(
    queries: { query: string; params: any[] }[]
) {
    const conn = await getConnection();
    await conn.beginTransaction();
    try {
        const results = [];
        for (const { query, params } of queries) {
            const [r] = await conn.query(query, params);
            results.push(r);
        }
        await conn.commit();
        return results;
    } catch (e) {
        await conn.rollback();
        throw e;
    } finally {
        await conn.end();
    }
}
