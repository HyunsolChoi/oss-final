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

// 인증 코드 정리
async function cleanupExpiredVerificationCodes() {
    try {
        await executeQuery(`
            DELETE FROM email_verification
            WHERE created_at < NOW() - INTERVAL 3 MINUTE
        `);
        console.log(`[이메일 인증 클리너] 만료된 인증 코드 삭제 완료`);
    } catch (error) {
        console.error('[이메일 인증 클리너 오류]:', error.message);
    }
}

// 1시간마다 실행 (60 * 60 * 1000 ms)
function startCleanupScheduler() {
    cleanupExpiredTokens().catch(console.error);
    cleanupExpiredVerificationCodes().catch(console.error);

    setInterval(() => {
        cleanupExpiredTokens().catch(console.error);
        cleanupExpiredVerificationCodes().catch(console.error);
    }, 60 * 60 * 1000);
}

module.exports = { startCleanupScheduler };
