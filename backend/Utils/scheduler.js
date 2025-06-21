const cron = require('node-cron');
const { executeQuery } = require('./executeDB');
const { refreshData } = require('./refreshData');

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
function startScheduler() {
    // 매 1시간마다 토큰 및 인증코드 클리너
    setInterval(() => {
        cleanupExpiredTokens().catch(console.error);
        cleanupExpiredVerificationCodes().catch(console.error);
    }, 60 * 60 * 1000);

    // 매 10분마다 view 클리너
    setInterval(() => {
        cleanupManageView().catch(console.error);
    }, 10 * 60 * 1000);

    // 매일 00시에 refreshData 실행
    cron.schedule('00 00 * * *', async () => {
        console.log('[00시 갱신] refreshData 실행 시작');
        try {
            await refreshData();
            console.log('[00시 갱신] refreshData 실행 완료');
        } catch (error) {
            console.error('[00시 갱신 오류]:', error.message);
        }
    });
}

module.exports = { startScheduler };
