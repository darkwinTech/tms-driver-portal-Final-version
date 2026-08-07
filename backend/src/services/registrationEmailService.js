import { escapeHtml } from '../utils/escapeHtml.js';
import { sendSmtpMail } from './smtpMailService.js';

export async function sendApprovalEmail(user) {
  return sendSmtpMail({
    to: user.email,
    subject: 'Your TMS Driver Portal registration has been approved',
    html: `
      <p>Hi ${escapeHtml(user.fullName)},</p>
      <p>
        Your registration for <strong>${escapeHtml(user.companyName)}</strong> has been
        approved. You can now sign in to the TMS Driver Portal with the email
        and password you registered with.
      </p>`,
  });
}

export async function sendRejectionEmail(user, reason) {
  return sendSmtpMail({
    to: user.email,
    subject: 'Your TMS Driver Portal registration was not approved',
    html: `
      <p>Hi ${escapeHtml(user.fullName)},</p>
      <p>
        Your registration for <strong>${escapeHtml(user.companyName)}</strong> was not
        approved.${reason ? ` Reason: ${escapeHtml(reason)}` : ''}
      </p>
      <p>If you believe this is a mistake, please contact Operations.</p>`,
  });
}
