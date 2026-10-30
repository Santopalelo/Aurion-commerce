import { Resend } from 'resend';

let resend = null;

if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
  console.log('✅ Resend email service configured');
} else {
  console.warn('⚠️  RESEND_API_KEY not set. Emails will not be sent.');
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'Aurion Commerce <onboarding@resend.dev>';
const STOREFRONT_URL = process.env.PRODUCTION_STOREFRONT_URL || 'http://localhost:3000';

export const sendOrderConfirmationEmail = async ({ to, order, store, storeSlug }) => {
  if (!resend) {
    console.warn('⚠️  Email not sent (Resend not configured):', { to });
    return { success: false, reason: 'Resend not configured' };
  }

  try {
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
              <h1 style="margin:0; font-size:24px; color:#111827;">${store?.name || 'Aurion Commerce'}</h1>
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
                <div style="margin-bottom:8px; overflow:hidden;">
                  <span style="color:#6b7280;">Subtotal</span>
                  <span style="color:#111827; float:right;">${currencySymbol}${Number(order.pricing?.subtotal || 0).toFixed(2)}</span>
                </div>
                ${
                  order.pricing?.discountAmount > 0
                    ? `<div style="margin-bottom:8px; overflow:hidden;">
                         <span style="color:#059669;">Discount</span>
                         <span style="color:#059669; float:right;">-${currencySymbol}${Number(order.pricing.discountAmount).toFixed(2)}</span>
                       </div>`
                    : ''
                }
                <div style="margin-bottom:8px; overflow:hidden;">
                  <span style="color:#6b7280;">Shipping</span>
                  <span style="color:#111827; float:right;">${order.pricing?.shippingCost === 0 ? 'FREE' : currencySymbol + Number(order.pricing?.shippingCost || 0).toFixed(2)}</span>
                </div>
                <div style="margin-bottom:8px; overflow:hidden;">
                  <span style="color:#6b7280;">Tax</span>
                  <span style="color:#111827; float:right;">${currencySymbol}${Number(order.pricing?.taxAmount || 0).toFixed(2)}</span>
                </div>
                <div style="padding-top:12px; border-top:1px solid #f3f4f6; margin-top:12px; overflow:hidden;">
                  <span style="font-weight:700; font-size:16px; color:#111827;">Total</span>
                  <span style="font-weight:700; font-size:16px; color:#111827; float:right;">${currencySymbol}${Number(order.pricing?.total || 0).toFixed(2)}</span>
                </div>
              </div>

              <div style="text-align:center; margin:32px 0 8px;">
                <a href="${orderUrl}"
                   style="display:inline-block; padding:14px 32px; background:#6366F1; color:white; text-decoration:none; border-radius:10px; font-weight:600;">
                  View Your Order
                </a>
              </div>
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
    `.trim();

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Order Confirmation - ${order.orderNumber}`,
      html,
      text,
    });

    if (error) {
      console.error('❌ Email send error:', error);
      return { success: false, error };
    }

    console.log(`✅ Email sent to ${to}: Order Confirmation - ${order.orderNumber}`);
    return { success: true, id: data?.id };
  } catch (error) {
    console.error('❌ Email service error:', error);
    return { success: false, error: error.message };
  }
};

export default {
  sendOrderConfirmationEmail,
};
