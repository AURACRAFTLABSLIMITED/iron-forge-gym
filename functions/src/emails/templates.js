/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: functions/src/emails/templates.js
 * Purpose: Responsive HTML email templates queued to Firestore's `mail` collection for the
 *          official Firebase "Trigger Email from Firestore" extension.
 *          Dynamically uses the gym's name and accent color from settings/site.
 */

function wrapLayout({ gymName, accentColor, heading, bodyHtml }) {
  return `
  <!doctype html>
  <html>
    <body style="margin:0;padding:24px;background-color:#0B0D0E;font-family:Arial,Helvetica,sans-serif;color:#F4F5F6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background-color:#14171A;border:1px solid #272B30;border-radius:8px;overflow:hidden;">
        <tr>
          <td style="padding:24px 28px;border-bottom:3px solid ${accentColor};background-color:#0E1012;">
            <h1 style="margin:0;font-size:22px;letter-spacing:1px;text-transform:uppercase;color:#FFFFFF;">${gymName}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:28px;">
            <h2 style="margin:0 0 14px 0;font-size:20px;color:${accentColor};">${heading}</h2>
            <div style="font-size:15px;line-height:1.6;color:#D1D5DB;">
              ${bodyHtml}
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 28px;border-top:1px solid #272B30;font-size:12px;color:#9CA3AF;background-color:#0E1012;">
            ${gymName} &middot; Powered by AURA CRAFT LABS LIMITED
          </td>
        </tr>
      </table>
    </body>
  </html>`;
}

export function buildWelcomeEmail({ gymName, accentColor, memberName, siteUrl }) {
  return {
    subject: `Welcome to ${gymName}`,
    html: wrapLayout({
      gymName,
      accentColor,
      heading: `Welcome to the club, ${memberName || 'Athlete'}`,
      bodyHtml: `
        <p>Your member account is now active. From your Member Portal you can view class schedules, reserve coaching spots, track attendance, and manage your membership plan.</p>
        <p style="margin-top:22px;">
          <a href="${siteUrl}/schedule" style="display:inline-block;padding:12px 22px;background-color:${accentColor};color:#0B0D0E;font-weight:bold;text-decoration:none;border-radius:4px;">View Weekly Schedule</a>
        </p>
      `,
    }),
  };
}

export function buildExpiryReminderEmail({
  gymName,
  accentColor,
  memberName,
  planName,
  expiryDate,
  siteUrl,
}) {
  return {
    subject: `Reminder: Your ${gymName} membership expires on ${expiryDate}`,
    html: wrapLayout({
      gymName,
      accentColor,
      heading: 'Membership Renewal Reminder',
      bodyHtml: `
        <p>Hi ${memberName || 'Member'},</p>
        <p>Your <strong>${planName || 'Club Membership'}</strong> is scheduled to expire on <strong>${expiryDate}</strong> (in 3 days).</p>
        <p>Renew online or at the front desk to keep uninterrupted access to classes and the strength floor.</p>
        <p style="margin-top:22px;">
          <a href="${siteUrl}/packages" style="display:inline-block;padding:12px 22px;background-color:${accentColor};color:#0B0D0E;font-weight:bold;text-decoration:none;border-radius:4px;">Renew Membership</a>
        </p>
      `,
    }),
  };
}

export function buildContactNotificationEmail({
  gymName,
  accentColor,
  name,
  email,
  phone,
  subject,
  message,
}) {
  return {
    subject: `[Contact Inquiry] ${subject}`,
    html: wrapLayout({
      gymName,
      accentColor,
      heading: 'New Contact Form Inquiry',
      bodyHtml: `
        <p><strong>From:</strong> ${name} (${email}${phone ? ` · ${phone}` : ''})</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <div style="margin-top:14px;padding:14px;background-color:#0B0D0E;border:1px solid #272B30;border-radius:4px;white-space:pre-line;">${message}</div>
      `,
    }),
  };
}

export function buildOrderPaidEmail({
  gymName,
  accentColor,
  customerName,
  orderId,
  total,
  currencySymbol,
  orderType,
}) {
  return {
    subject: `Payment Confirmed — ${gymName} (#${orderId.slice(0, 8)})`,
    html: wrapLayout({
      gymName,
      accentColor,
      heading: 'Payment Confirmed',
      bodyHtml: `
        <p>Hi ${customerName || 'Member'},</p>
        <p>We received your payment of <strong>${currencySymbol} ${Number(total).toLocaleString('en-US', { maximumFractionDigits: 2 })}</strong> for your ${orderType} order (<strong>#${orderId.slice(0, 8)}</strong>).</p>
        <p>${orderType === 'membership' ? 'Your membership plan is now active in your Member Portal.' : 'Our front desk team is preparing your order.'}</p>
      `,
    }),
  };
}
