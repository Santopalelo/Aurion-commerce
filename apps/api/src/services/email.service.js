import { Resend } from 'resend';
import { env } from '../config/env.js';

/**
 * Email Service using Resend
 *
 * Sends transactional emails (password reset, verification, order confirmations)
 */

let resend = null;

if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
  console.log('✅ Resend email service configured');
} else {
  console.warn('⚠️  RESEND_API_KEY not set. Emails will not be sent.');
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'Aurion Commerce <onboarding@resend.dev>';
const DASHBOARD_URL = process.env.PRODUCTION_DASHBOARD_URL || 'http://localhost:5173';

/**
 * Send an email
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  if (!resend) {
    console.warn('⚠️  Email not sent (Resend not configured):', { to, subject });
    return { success: false, reason: 'Resend not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      console.error('❌ Email send error:', error);
      return { success: false, error };
    }

    console.log(`✅ Email sent to ${to}: ${subject}`);
    return { success: true, id: data?.id };
  } catch (error) {
    console.error('❌ Email service error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send password reset email (for merchants)
 */
export const sendPasswordResetEmail = async ({ to, firstName, resetToken }) => {
  const resetUrl = `${DASHBOARD_URL}/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Reset your password</title>
      </head>
      <body style="margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#f9fafb;">
        <div style="max-width:600px; margin:0 auto; padding:40px 20px;">

          <!-- Logo -->
          <div style="text-align:center; margin-bottom:32px;">
            <div style="display:inline-block; width:56px; height:56px; background:linear-gradient(135deg,#6366F1,#4338CA); border-radius:14px; text-align:center; line-height:56px;">
              <span style="font-size:28px;">✨</span>
            </div>
            <h1 style="margin:12px 0 0; font-size:24px; color:#111827;">Aurion Commerce</h1>
          </div>

          <!-- Card -->
          <div style="background:white; border-radius:16px; padding:40px; box-shadow:0 4px 6px rgba(0,0,0,0.05);">
            <h2 style="margin:0 0 16px; font-size:22px; color:#111827;">Reset your password</h2>
            <p style="margin:0 0 20px; color:#4b5563; font-size:15px; line-height:1.6;">
              Hi ${firstName || 'there'},
            </p>
            <p style="margin:0 0 20px; color:#4b5563; font-size:15px; line-height:1.6;">
              We received a request to reset your Aurion Commerce password. Click the button below to create a new password.
            </p>

            <div style="text-align:center; margin:32px 0;">
              <a href="${resetUrl}"
                 style="display:inline-block; padding:14px 32px; background:#6366F1; color:white; text-decoration:none; border-radius:10px; font-weight:600; font-size:15px;">
                Reset password
              </a>
            </div>

            <p style="margin:0 0 12px; color:#4b5563; font-size:14px; line-height:1.6;">
              Or copy and paste this link into your browser:
            </p>
            <p style="margin:0 0 24px; padding:12px; background:#f3f4f6; border-radius:8px; word-break:break-all; font-family:monospace; font-size:12px; color:#4b5563;">
              ${resetUrl}
            </p>

            <div style="padding:16px; background:#fef3c7; border-radius:8px; margin-top:24px;">
              <p style="margin:0; color:#92400e; font-size:13px; line-height:1.5;">
                ⏰ This link expires in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align:center; margin-top:32px;">
            <p style="margin:0; color:#9ca3af; font-size:13px;">
              © ${new Date().getFullYear()} Aurion Commerce. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Hi ${firstName || 'there'},

We received a request to reset your Aurion Commerce password.

Reset your password: ${resetUrl}

This link expires in 1 hour. If you didn't request this, you can safely ignore this email.

— Aurion Commerce
  `.trim();

  return sendEmail({
    to,
    subject: 'Reset your Aurion Commerce password',
    html,
    text,
  });
};

/**
 * Send welcome email after registration
 */
export const sendWelcomeEmail = async ({ to, firstName }) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#f9fafb;">
        <div style="max-width:600px; margin:0 auto; padding:40px 20px;">
          <div style="text-align:center; margin-bottom:32px;">
            <div style="display:inline-block; width:56px; height:56px; background:linear-gradient(135deg,#6366F1,#4338CA); border-radius:14px; text-align:center; line-height:56px;">
              <span style="font-size:28px;">✨</span>
            </div>
            <h1 style="margin:12px 0 0; font-size:24px; color:#111827;">Welcome to Aurion Commerce</h1>
          </div>
          <div style="background:white; border-radius:16px; padding:40px; box-shadow:0 4px 6px rgba(0,0,0,0.05);">
            <h2 style="margin:0 0 16px; font-size:22px; color:#111827;">Welcome, ${firstName}! 🎉</h2>
            <p style="margin:0 0 20px; color:#4b5563; font-size:15px; line-height:1.6;">
              Thanks for signing up! You're all set to start building your online store with Aurion.
            </p>
            <p style="margin:0 0 20px; color:#4b5563; font-size:15px; line-height:1.6;">
              Here's what you can do next:
            </p>
            <ul style="color:#4b5563; font-size:15px; line-height:1.8;">
              <li>Set up your store name and branding</li>
              <li>Add your first products with images</li>
              <li>Organize with categories</li>
              <li>Share your store URL and start selling!</li>
            </ul>
            <div style="text-align:center; margin:32px 0 8px;">
              <a href="${DASHBOARD_URL}/dashboard"
                 style="display:inline-block; padding:14px 32px; background:#6366F1; color:white; text-decoration:none; border-radius:10px; font-weight:600;">
                Go to dashboard
              </a>
            </div>
          </div>
          <div style="text-align:center; margin-top:32px;">
            <p style="margin:0; color:#9ca3af; font-size:13px;">
              © ${new Date().getFullYear()} Aurion Commerce
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: 'Welcome to Aurion Commerce! 🎉',
    html,
    text: `Welcome ${firstName}! Get started at ${DASHBOARD_URL}/dashboard`,
  });
};

export default {
  sendEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
};