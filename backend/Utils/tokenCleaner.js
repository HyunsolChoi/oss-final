const { executeQuery } = require('./executeDB');

async function cleanupExpiredTokens() {
    try {
        await executeQuery(`
      DELETE FROM user_tokens
      WHERE expires_at < NOW()
    `);
        console.log(`[토큰 클리너] 만료된 토큰 삭제 완료`);
    } catch (error) {
        console.error('[토큰 클리너 오류]:', error.message);
    }
}

// 1시간마다 실행 (1 * 60 * 60 * 1000 ms)
function startTokenCleanupScheduler() {
    cleanupExpiredTokens().catch(console.error);
    setInterval(() => {
        cleanupExpiredTokens().catch(console.error);
    }, 60 * 60 * 1000);
}

module.exports = { startTokenCleanupScheduler };
