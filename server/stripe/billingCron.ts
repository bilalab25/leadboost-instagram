import { billingService } from './billingService';

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds

let cronInterval: NodeJS.Timer | null = null;
let isRunning = false; // Lock to prevent concurrent runs

export async function runBillingCycle() {
  // Prevent concurrent runs
  if (isRunning) {
    console.log('[Billing Cron] Billing cycle already in progress, skipping...');
    return { successCount: 0, failCount: 0, skipped: true };
  }
  
  isRunning = true;
  console.log('[Billing Cron] Starting billing cycle...');
  
  try {
    // Get all brands with unbilled usage
    const unbilledUsage = await billingService.getAllUnbilledUsage();
    
    console.log(`[Billing Cron] Found ${unbilledUsage.length} brands with unbilled usage`);

    let successCount = 0;
    let failCount = 0;

    for (const usage of unbilledUsage) {
      if (usage.totalCents <= 0) continue;

      try {
        const result = await billingService.chargeAccumulatedUsage(usage.brandId);
        
        if (result) {
          successCount++;
          console.log(`[Billing Cron] Charged brand ${usage.brandId}: $${(usage.totalCents / 100).toFixed(2)} for ${usage.totalImages} images`);
        }
      } catch (error) {
        failCount++;
        console.error(`[Billing Cron] Failed to charge brand ${usage.brandId}:`, error);
      }
    }

    console.log(`[Billing Cron] Billing cycle complete. Success: ${successCount}, Failed: ${failCount}`);
    
    return { successCount, failCount };
  } catch (error) {
    console.error('[Billing Cron] Error running billing cycle:', error);
    throw error;
  } finally {
    isRunning = false;
  }
}

export function startBillingCron() {
  if (cronInterval) {
    console.log('[Billing Cron] Already running');
    return;
  }

  console.log('[Billing Cron] Starting cron job (every 2 days)');
  
  // Run immediately on startup (optional - comment out if not desired)
  // runBillingCycle().catch(err => console.error('[Billing Cron] Initial run error:', err));

  // Schedule to run every 2 days
  cronInterval = setInterval(() => {
    runBillingCycle().catch(err => 
      console.error('[Billing Cron] Scheduled run error:', err)
    );
  }, TWO_DAYS_MS);

  // Log next run time
  const nextRun = new Date(Date.now() + TWO_DAYS_MS);
  console.log(`[Billing Cron] Next billing cycle: ${nextRun.toISOString()}`);
}

export function stopBillingCron() {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
    console.log('[Billing Cron] Stopped');
  }
}
