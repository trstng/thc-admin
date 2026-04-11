import sgMail from "@sendgrid/mail";

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "team@tidyhomecompany.com";
const FROM_NAME = process.env.SENDGRID_FROM_NAME || "Tidy Home Co.";
const REVIEW_URL = "https://g.page/TidyHomeCompany/review";

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export type EmailTemplate =
  | "upcoming_reminder"
  | "booking_confirmation"
  | "cleaning_complete"
  | "review_request";

export type SendEmailParams = {
  to: string;
  template: EmailTemplate;
  clientName: string;
  jobDate?: string;
  jobTime?: string;
  address?: string;
};

const TEMPLATE_META: Record<EmailTemplate, { subject: string; headline: string; body: (p: SendEmailParams) => string; cta?: { label: string; url: string } }> = {
  upcoming_reminder: {
    subject: "Your upcoming cleaning with Tidy Home Co.",
    headline: "Your cleaning is coming up",
    body: (p) =>
      `Hi ${p.clientName},<br/><br/>This is a friendly reminder that your next Tidy Home Co. cleaning is scheduled for <strong>${p.jobDate || "your upcoming date"}${p.jobTime ? ` at ${p.jobTime}` : ""}</strong>${p.address ? ` at <strong>${p.address}</strong>` : ""}. Our team is looking forward to taking care of your space!<br/><br/>If anything has changed, please reply to this email or give us a call.`,
  },
  booking_confirmation: {
    subject: "You're booked! — Tidy Home Co.",
    headline: "Booking confirmed",
    body: (p) =>
      `Hi ${p.clientName},<br/><br/>Thanks for booking with Tidy Home Co.! We've confirmed your cleaning for <strong>${p.jobDate || "the date we discussed"}${p.jobTime ? ` at ${p.jobTime}` : ""}</strong>${p.address ? ` at <strong>${p.address}</strong>` : ""}.<br/><br/>We'll send a reminder the day before. Can't wait to tidy your home!`,
  },
  cleaning_complete: {
    subject: "Thank you from Tidy Home Co.",
    headline: "All done — thank you!",
    body: (p) =>
      `Hi ${p.clientName},<br/><br/>We've finished your cleaning and we hope you love how it looks. Thank you for trusting Tidy Home Co. with your home — it means the world to us.<br/><br/>If anything isn't quite right, just reply to this email and we'll make it perfect.`,
  },
  review_request: {
    subject: "How did we do? — Tidy Home Co.",
    headline: "Would you share your experience?",
    body: (p) =>
      `Hi ${p.clientName},<br/><br/>Thank you for choosing Tidy Home Co. As a small local business, reviews mean everything to us. If you have a moment, we'd so appreciate a quick Google review — it helps other Waco families find us.`,
    cta: { label: "Leave a Google Review", url: REVIEW_URL },
  },
};

function renderHtml(params: SendEmailParams): { subject: string; html: string } {
  const meta = TEMPLATE_META[params.template];
  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f7f8fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Roboto,sans-serif;color:#0f172a;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 24px -12px rgba(15,23,42,0.1);">
            <tr>
              <td style="background:linear-gradient(180deg,#fa5252,#e03131);padding:28px 32px;color:#ffffff;">
                <div style="font-size:13px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.85;">Tidy Home Co.</div>
                <div style="font-size:22px;font-weight:650;margin-top:4px;letter-spacing:-0.02em;">${meta.headline}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px;font-size:15px;line-height:1.6;color:#334155;">
                ${meta.body(params)}
                ${meta.cta
                  ? `<div style="margin-top:24px;"><a href="${meta.cta.url}" style="display:inline-block;background:#fa5252;color:#ffffff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:600;font-size:14px;">${meta.cta.label}</a></div>`
                  : ""}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid #eef0f3;font-size:12px;color:#94a3b8;text-align:center;">
                Tidy Home Co. &nbsp;·&nbsp; Waco, TX
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  return { subject: meta.subject, html };
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  if (!process.env.SENDGRID_API_KEY) {
    throw new Error("SENDGRID_API_KEY is not set");
  }
  const { subject, html } = renderHtml(params);
  await sgMail.send({
    to: params.to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject,
    html,
  });
}

/** Map an EmailTemplate to the Airtable Automations Log "Automation Type" value. */
export function templateToLogType(t: EmailTemplate): string {
  switch (t) {
    case "upcoming_reminder":
      return "Appointment Reminder";
    case "booking_confirmation":
      return "Booking Confirmation";
    case "cleaning_complete":
      return "Post-Job Follow-Up";
    case "review_request":
      return "Review Request";
  }
}
