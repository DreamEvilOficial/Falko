import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY || '';
const resendFrom = process.env.RESEND_FROM_EMAIL || 'no-reply@urban.local';

export const sendEmail = async (to: string, subject: string, html: string) => {
    if (!resendApiKey) {
        console.warn('[EMAIL] RESEND_API_KEY not configured, skipping send');
        return false;
    }

    try {
        const resend = new Resend(resendApiKey);
        await resend.emails.send({
            from: resendFrom,
            to,
            subject,
            html
        });
        return true;
    } catch (error: any) {
        console.error('[EMAIL] Error sending email with Resend:', error?.message || error);
        return false;
    }
};
