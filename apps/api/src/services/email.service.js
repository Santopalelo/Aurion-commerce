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
const STOREFRONT_URL = process.env.PRODUCTION_STOREFRONT_URL || 'http://localhost:3000';
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

/**
 * Send order confirmation email
 */
export const sendOrderConfirmationEmail = async ({ to, order, store, storeSlug }) => {
  const currencySymbol = store?.currencySymbol || '$';
  const orderUrl = `${STOREFRONT_URL}/${storeSlug}/orders/${order.orderNumber}?email=${encodeURIComponent(to)}`;

  const itemsHtml = (order.items || [])
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 0; border-bottom:1px solid #f3f4f6;">
            <div style="font-weight:600; color:#111827;">${item.title}</div>
            <div style="font-size:13px; color:#6b7280;">Qty: ${item.quantity}</div>
          </td>
          <td style="padding:12px 0; border-bottom:1px solid #f3f4f6; text-align:right; font-weight:600; color:#111827;">
            ${currencySymbol}${Number(item.totalPrice || item.price * item.quantity).toFixed(2)}
          </td>
        </tr>
      `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation</title>
      </head>
      <body style="margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#f9fafb;">
        <div style="max-width:600px; margin:0 auto; padding:40px 20px;">
          <div style="text-align:center; margin-bottom:32px;">
            <div style="display:inline-block; width:56px; height:56px; background:linear-gradient(135deg,#6366F1,#4338CA); border-radius:14px; text-align:center; line-height:56px;">
              <span style="font-size:28px;">✨</span>
            </div>
            <h1 style="margin:12px 0 0; font-size:24px; color:#111827;">${store?.name || 'Aurion Commerce'}</h1>
          </div>

          <div style="background:white; border-radius:16px; padding:40px; box-shadow:0 4px 6px rgba(0,0,0,0.05);">
            <h2 style="margin:0 0 8px; font-size:22px; color:#111827;">Order Confirmed! 🎉</h2>
            <p style="margin:0 0 24px; color:#4b5563; font-size:15px; line-height:1.6;">
              Thank you for your order. We've received your payment and your order is being processed.
            </p>

            <div style="background:#f0f9ff; border:1px solid #bae6fd; border-radius:12px; padding:16px; margin-bottom:24px;">
              <p style="margin:0 0 4px; font-size:13px; color:#0369a1;">Order Number</p>
              <p style="margin:0; font-size:18px; font-weight:700; color:#075985; font-family:monospace;">${order.orderNumber}</p>
            </div>

            <h3 style="margin:0 0 16px; font-size:16px; color:#111827;">Order Summary</h3>
            <table style="width:100%; border-collapse:collapse;">
              ${itemsHtml}
            </table>

            <div style="margin-top:16px; padding-top:16px; border-top:2px solid #f3f4f6;">
              <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                <span style="color:#6b7280;">Subtotal</span>
                <span style="color:#111827;">${currencySymbol}${Number(order.pricing?.subtotal || 0).toFixed(2)}</span>
              </div>
              ${
                order.pricing?.discountAmount > 0
                  ? `<div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                       <span style="color:#059669;">Discount</span>
                       <span style="color:#059669;">-${currencySymbol}${Number(order.pricing.discountAmount).toFixed(2)}</span>
                     </div>`
                  : ''
              }
              <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                <span style="color:#6b7280;">Shipping</span>
                <span style="color:#111827;">${order.pricing?.shippingCost === 0 ? 'FREE' : currencySymbol + Number(order.pricing?.shippingCost || 0).toFixed(2)}</span>
              </div>
              <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                <span style="color:#6b7280;">Tax</span>
                <span style="color:#111827;">${currencySymbol}${Number(order.pricing?.taxAmount || 0).toFixed(2)}</span>
              </div>
              <div style="display:flex; justify-content:space-between; padding-top:12px; border-top:1px solid #f3f4f6; margin-top:12px;">
                <span style="font-weight:700; font-size:16px; color:#111827;">Total</span>
                <span style="font-weight:700; font-size:16px; color:#111827;">${currencySymbol}${Number(order.pricing?.total || 0).toFixed(2)}</span>
              </div>
            </div>

            <div style="text-align:center; margin:32px 0 8px;">
              <a href="${orderUrl}"
                 style="display:inline-block; padding:14px 32px; background:#6366F1; color:white; text-decoration:none; border-radius:10px; font-weight:600;">
                View Your Order
              </a>
            </div>

            <p style="margin:16px 0 0; color:#6b7280; font-size:13px; text-align:center; line-height:1.6;">
              If you have any questions about your order, reply to this email or contact us.
            </p>
          </div>

          <div style="text-align:center; margin-top:32px;">
            <p style="margin:0; color:#9ca3af; font-size:13px;">
              © ${new Date().getFullYear()} ${store?.name || 'Aurion Commerce'}. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Order Confirmed!

Thank you for your order from ${store?.name || 'Aurion Commerce'}.

Order Number: ${order.orderNumber}
Total: ${currencySymbol}${Number(order.pricing?.total || 0).toFixed(2)}

View your order: ${orderUrl}

We'll send you another email when your order ships.
  `.trim();

  return sendEmail({
    to,
    subject: `Order Confirmation - ${order.orderNumber}`,
    html,
    text,
  });
};

export default {
  sendEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
};