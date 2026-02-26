export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
        const cron = await import('node-cron');
        const { runBackup } = await import('@/lib/backupService');

        console.log('[Instrumentation] Registering daily backup job...');

        // Schedule: 12:00 AM every day (00:00)
        // Format: minute hour day-of-month month day-of-week
        cron.schedule('0 0 * * *', async () => {
          console.log('[Cron] Running scheduled backup...');
          await runBackup();
        });
        
        console.log('[Instrumentation] Backup cron job scheduled for 00:00 daily.');
    } catch (error) {
        console.error('[Instrumentation] Failed to register backup service:', error);
    }
  }
}
