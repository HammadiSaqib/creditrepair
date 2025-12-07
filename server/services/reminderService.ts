import { emailService } from './emailService.js';
import { getQuery } from '../database/databaseAdapter.js';

class ReminderService {
  private checkInterval: NodeJS.Timeout | null = null;

  start() {
    if (this.checkInterval) return;

    // Run immediately on startup
    this.checkAndSendReminders();

    // Then run every 24 hours (86400000 ms)
    // To be more robust in a real app, we'd use node-cron to schedule for a specific time.
    // Here we'll just check periodically.
    this.checkInterval = setInterval(() => {
      this.checkAndSendReminders();
    }, 24 * 60 * 60 * 1000);
    
    console.log('📅 Reminder service started');
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  public async checkAndSendReminders() {
    try {
      const today = new Date();
      const dayOfMonth = today.getDate();

      console.log(`Checking for payment reminders for day ${dayOfMonth}...`);

      const query = `
        SELECT 
          dp.id,
          dp.account_name, 
          dp.target_utilization, 
          dp.payment_date, 
          c.email, 
          c.first_name,
          c.last_name
        FROM debt_payoff_plans dp 
        JOIN clients c ON dp.client_id = c.id 
        WHERE dp.reminder_enabled = 1 
        AND dp.payment_date = ?
      `;

      // Use a cast or ensure parameter type matches what getQuery expects (likely any[] or similar)
      const plansToRemind = await getQuery(query, [dayOfMonth]);

      if (!plansToRemind || !Array.isArray(plansToRemind) || plansToRemind.length === 0) {
        console.log('No reminders to send today.');
        return;
      }

      console.log(`Found ${plansToRemind.length} reminders to send.`);

      for (const plan of plansToRemind) {
        await this.sendReminderEmail(plan);
      }

    } catch (error) {
      console.error('Error in checkAndSendReminders:', error);
    }
  }

  private async sendReminderEmail(plan: any) {
    try {
      const subject = `Payment Reminder: ${plan.account_name}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Payment Reminder</h2>
          <p>Hello ${plan.first_name},</p>
          <p>This is a friendly reminder to make a payment on your <strong>${plan.account_name}</strong> account.</p>
          <p>
            <strong>Target Utilization:</strong> ${plan.target_utilization}%<br>
            <strong>Scheduled Payment Date:</strong> Day ${plan.payment_date} of every month
          </p>
          <p>Making consistent payments helps you reach your target utilization faster!</p>
          <div style="margin-top: 20px; padding: 15px; background-color: #f3f4f6; border-radius: 5px;">
            <p style="margin: 0; font-size: 0.9em; color: #6b7280;">
              You are receiving this email because you enabled payment reminders for this account.
            </p>
          </div>
        </div>
      `;

      await emailService.sendEmail({
        to: plan.email,
        subject,
        html
      });

      console.log(`Sent reminder email to ${plan.email} for account ${plan.account_name}`);
    } catch (error) {
      console.error(`Failed to send reminder to ${plan.email}:`, error);
    }
  }
}

export const reminderService = new ReminderService();
