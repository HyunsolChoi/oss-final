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

// manage_view 정리 (3분 지난 기록 삭제)
async function cleanupManageView() {
    try {
        await executeQuery(`
            DELETE FROM manage_view
            WHERE viewed_at < NOW() - INTERVAL 3 MINUTE
        `);
        console.log(`[View 히스토리 클리너] 기록 삭제 완료`);
    } catch (error) {
        console.error('[View 히스토리 클리너 오류]:', error.message);
    }
}

// 1시간마다 실행 (60 * 60 * 1000 ms)
function startCleanupScheduler() {
    cleanupExpiredTokens().catch(console.error);
    cleanupExpiredVerificationCodes().catch(console.error);
    cleanupManageView().catch(console.error);
    cleanupConsultationRetries().catch(console.error);

    setInterval(() => {
        cleanupExpiredTokens().catch(console.error);
        cleanupExpiredVerificationCodes().catch(console.error);
    }, 60 * 60 * 1000); // 1시간

    setInterval(() => {
        cleanupManageView().catch(console.error);
    }, 10 * 60 * 1000); // 10분

    // 매일 00:00에 컨설팅 갱신 기록 정리
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    setTimeout(() => {
        cleanupConsultationRetries().catch(console.error);
        // 이후 매일 자정에 실행
        setInterval(() => {
            cleanupConsultationRetries().catch(console.error);
        }, 24 * 60 * 60 * 1000); // 24시간
    }, msUntilMidnight);
}

//컨설팅 갱신 횟수 정리
async function cleanupConsultationRetries() {
    try {
        await executeQuery(`
            DELETE FROM consultation_retries
            WHERE retry_date < CURDATE()
        `);
        console.log(`[컨설팅 갱신 클리너] 이전 날짜 기록 삭제 완료`);
    } catch (error) {
        console.error('[컨설팅 갱신 클리너 오류]:', error.message);
    }
}

module.exports = { startCleanupScheduler };
