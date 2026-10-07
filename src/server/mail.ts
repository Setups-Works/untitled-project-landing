import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { serverEnv } from "../config/env";

const g = globalThis as unknown as { __mailer?: Transporter };

function smtpUser(url: string) {
  try {
    const u = decodeURIComponent(new URL(url).username);
    return u.includes("@") ? u : null;
  } catch {
    return null;
  }
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Sends one transactional email. In development SMTP_URL points at Mailpit (http://localhost:8025) so nothing real is sent. */
export async function sendMail(to: string, subject: string, text: string, action?: { label: string; url: string }) {
  const url = serverEnv().smtpUrl;
  if (!url) {
    console.warn(`[mail] SMTP_URL is not set — email "${subject}" to ${to} was not sent.`);
    return;
  }
  g.__mailer ??= nodemailer.createTransport(url);
  // Matches the website: cream page, white rounded card, serif headline, forest-green accent, dark pill button.
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f5f4eb">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4eb"><tr><td align="center" style="padding:32px 16px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">
      <tr><td style="padding:0 8px 16px;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#1b1c14">
        <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#1f5d49;margin-right:8px"></span>untitled project
      </td></tr>
      <tr><td style="background:#ffffff;border-radius:24px;border:1px solid #e4e1d2;padding:32px 28px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;color:#1b1c14">
        <p style="margin:0 0 6px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#7e7e72">${esc(subject)}</p>
        <p style="margin:0 0 22px;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.2;color:#1b1c14">One workspace, <span style="color:#5f6055">any AI.</span></p>
        <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#3d3e33">${esc(text).replace(/\n/g, "<br>")}</p>
        ${action ? `<p style="margin:0 0 20px"><a href="${esc(action.url)}" style="display:inline-block;padding:14px 26px;border-radius:999px;background:#191d1a;color:#f4f3e9;text-decoration:none;font-weight:600;font-size:15px">${esc(action.label)} →</a></p><p style="margin:0;font-size:13px;line-height:1.5;color:#7e7e72;word-break:break-all">Button not working? Paste this link into your browser:<br>${esc(action.url)}</p>` : ""}
      </td></tr>
      <tr><td style="padding:16px 8px 0;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:#8f9084">
        You received this because someone used this address on untitled project. If that wasn't you, you can ignore this email.<br>Backed by Setups Works.
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
  await g.__mailer.sendMail({
    // Most SMTP servers only accept a sender they own, so default to the SMTP login when it is an address.
    from: process.env.MAIL_FROM?.trim() || `untitled project <${smtpUser(url) ?? "no-reply@localhost"}>`,
    to,
    subject,
    text: action ? `${text}\n\n${action.label}: ${action.url}` : text,
    html,
  });
}
