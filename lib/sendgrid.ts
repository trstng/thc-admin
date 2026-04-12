import sgMail from "@sendgrid/mail";

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "team@tidyhomecompany.com";
const FROM_NAME = process.env.SENDGRID_FROM_NAME || "Tidy Home Co.";
const REVIEW_URL = "https://g.page/TidyHomeCompany/review";
const LOGO_URL =
  "https://vtxz5y44w6e4isy6.public.blob.vercel-storage.com/PNG%20image.png";

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
  quote?: string;
};

/* ------------------------------------------------------------------ */
/*  Shared styles & wrapper                                           */
/* ------------------------------------------------------------------ */

const STYLES = `
body, table, td, a {
  -webkit-text-size-adjust:100%;
  -ms-text-size-adjust:100%;
}
table, td {
  mso-table-lspace:0pt;
  mso-table-rspace:0pt;
}
img {
  -ms-interpolation-mode:bicubic;
  border:0;
  outline:none;
  text-decoration:none;
  display:block;
}
table {
  border-collapse:collapse !important;
}
body {
  margin:0 !important;
  padding:0 !important;
  width:100% !important;
  height:100% !important;
  background-color:#fdf7fa;
  font-family:Arial,Helvetica,sans-serif;
  color:#5c4a52;
}
.email-wrapper {
  width:100%;
  background:repeating-linear-gradient(to right,#f8dfe7 0px,#f8dfe7 60px,#fffafb 60px,#fffafb 120px);
  padding:30px 15px;
}
.container {
  max-width:620px;
  margin:0 auto;
  background-color:rgba(255,255,255,0.94);
  border-radius:20px;
  overflow:hidden;
  box-shadow:0 6px 24px rgba(214,128,156,0.12);
}
.inner {
  padding:36px 32px;
}
.logo {
  margin:0 auto 20px auto;
  width:130px;
  max-width:130px;
  height:auto;
}
.title {
  font-size:30px;
  line-height:38px;
  font-weight:bold;
  color:#e56f98;
  text-align:center;
  margin:0 0 10px 0;
}
.subtitle {
  font-size:16px;
  line-height:24px;
  color:#7a6570;
  text-align:center;
  margin:0 0 28px 0;
}
.greeting {
  font-size:18px;
  line-height:28px;
  color:#5c4a52;
  margin:0 0 18px 0;
}
.content {
  font-size:15px;
  line-height:24px;
  color:#5c4a52;
  margin:0 0 24px 0;
}
.details-box {
  background-color:#fff7fa;
  border:1px solid #f3c7d6;
  border-radius:16px;
  padding:22px;
  margin:0 0 28px 0;
}
.section-title {
  font-size:18px;
  line-height:26px;
  font-weight:bold;
  color:#dd6d93;
  margin:0 0 14px 0;
}
.detail-row {
  padding:10px 0;
  border-bottom:1px solid #f5dbe4;
}
.detail-row-last {
  padding:10px 0;
  border-bottom:none;
}
.detail-label {
  font-size:13px;
  line-height:20px;
  font-weight:bold;
  color:#b96a87;
  text-transform:uppercase;
  letter-spacing:0.5px;
  margin:0 0 4px 0;
}
.detail-value {
  font-size:16px;
  line-height:24px;
  color:#5c4a52;
  margin:0;
}
.checklist-box {
  background-color:#fffafd;
  border:1px solid #f3d7e2;
  border-radius:16px;
  padding:22px;
  margin:0 0 24px 0;
}
.checklist {
  margin:0;
  padding-left:20px;
  color:#5c4a52;
}
.checklist li {
  font-size:15px;
  line-height:24px;
  margin-bottom:10px;
}
.footer {
  font-size:13px;
  line-height:20px;
  color:#8a7880;
  text-align:center;
  padding:0 32px 32px 32px;
}
.highlight {
  color:#dd6d93;
  font-weight:bold;
}
.cta-btn {
  display:inline-block;
  background:#e56f98;
  color:#ffffff !important;
  padding:14px 28px;
  border-radius:14px;
  text-decoration:none;
  font-weight:bold;
  font-size:15px;
  margin-top:8px;
}
@media screen and (max-width:620px) {
  .inner { padding:28px 20px; }
  .footer { padding:0 20px 28px 20px; }
  .title { font-size:26px; line-height:34px; }
  .logo { width:110px; max-width:110px; }
}
`;

function shell(title: string, inner: string): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
<title>${title}</title>
<style>${STYLES}</style>
</head>
<body>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td class="email-wrapper" align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="container" style="max-width:620px;">
<tr>
<td class="inner">
<img src="${LOGO_URL}" alt="Tidy Home Co." class="logo"/>
${inner}
</td>
</tr>
<tr>
<td class="footer">
Tidy Home Co.<br/>
Please reply to this email if you need to update your appointment.
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;
}

function detailRow(label: string, value: string, last = false): string {
  return `<div class="${last ? "detail-row-last" : "detail-row"}">
<p class="detail-label">${label}</p>
<p class="detail-value">${value}</p>
</div>`;
}

function detailsBox(title: string, rows: string): string {
  return `<div class="details-box">
<p class="section-title">${title}</p>
${rows}
</div>`;
}

function checklistBox(title: string, items: string[]): string {
  const lis = items.map((i) => `<li>${i}</li>`).join("\n");
  return `<div class="checklist-box">
<p class="section-title">${title}</p>
<ul class="checklist">
${lis}
</ul>
</div>`;
}

/* ------------------------------------------------------------------ */
/*  Per-template renderers                                            */
/* ------------------------------------------------------------------ */

function renderBookingConfirmation(p: SendEmailParams): string {
  const hasQuote = !!p.quote;
  const rows = [
    detailRow("Service Address", p.address || "—"),
    detailRow("Date", p.jobDate || "—"),
    detailRow("Time", p.jobTime || "—"),
    detailRow("Quoted Price", hasQuote ? p.quote! : "—", true),
  ].join("\n");

  const inner = `
<h1 class="title">Your Cleaning is Booked</h1>
<p class="subtitle">We're excited to make your home shine. Here are your appointment details.</p>
<p class="greeting">Hi ${p.clientName},</p>
<p class="content">
  Thanks for booking with <span class="highlight">Tidy Home Co.</span>
  Your appointment has been confirmed, and we've saved the details below.
</p>
${detailsBox("Booking Details", rows)}
${checklistBox("A Few Things to Prepare Before We Arrive", [
  "Please put dogs or other pets in a secure area if needed.",
  "Move heavy clutter, clothing, toys, or loose items off floors and surfaces.",
  "Make sure we have a clear way to access the home.",
  "Secure any fragile or valuable items you do not want moved.",
  "Let us know in advance about any priority rooms or special instructions.",
  "If applicable, please provide gate codes, entry notes, or parking instructions.",
])}
<p class="content" style="margin-bottom:0;">
  We appreciate your business and look forward to taking care of your home.
</p>`;

  return shell("Booking Confirmation", inner);
}

function renderUpcomingReminder(p: SendEmailParams): string {
  const hasQuote = !!p.quote;
  const rows = [
    detailRow("Service Address", p.address || "—"),
    detailRow("Date", p.jobDate || "—"),
    detailRow("Time", p.jobTime || "—"),
    detailRow("Quoted Price", hasQuote ? p.quote! : "—", true),
  ].join("\n");

  const inner = `
<h1 class="title">Cleaning Appointment Reminder</h1>
<p class="subtitle">Just a quick reminder about your upcoming cleaning.</p>
<p class="greeting">Hi ${p.clientName},</p>
<p class="content">
  This is a friendly reminder that your upcoming cleaning with
  <span class="highlight">Tidy Home Co.</span> is scheduled soon.
  Please review the details below and make sure everything is ready for our team.
</p>
${detailsBox("Appointment Details", rows)}
${checklistBox("A Few Things to Prepare Before We Arrive", [
  "Please place dogs or pets in a secure area if necessary.",
  "Move heavy clutter, clothing, toys, or loose items from floors and surfaces.",
  "Please ensure the kitchen sink is cleared out unless dishes were selected as an add-on.",
  "Please provide access instructions (codes, keys, entry notes, etc.).",
  "Secure fragile or delicate items you prefer we do not move.",
  "Notify us ahead of time of any special requests or priority areas.",
  "For safety reasons, we do not clean biohazardous materials.",
])}
<p class="content" style="margin-bottom:0;">
  We appreciate the opportunity to care for your home and look forward to making it shine.
</p>`;

  return shell("Cleaning Appointment Reminder", inner);
}

function renderCleaningComplete(p: SendEmailParams): string {
  const rows = [
    detailRow("Service Address", p.address || "—"),
    detailRow("Date", p.jobDate || "—"),
    detailRow("Time", p.jobTime || "—", true),
  ].join("\n");

  const inner = `
<h1 class="title">Your Home is Sparkling Clean</h1>
<p class="subtitle">We've finished your cleaning — here's a quick summary.</p>
<p class="greeting">Hi ${p.clientName},</p>
<p class="content">
  We've wrapped up your cleaning and we hope you love how everything looks!
  Thank you for trusting <span class="highlight">Tidy Home Co.</span> with your home — it means the world to us.
</p>
${detailsBox("Cleaning Summary", rows)}
<p class="content">
  If anything isn't quite right, just reply to this email and we'll make it perfect.
</p>
<p class="content" style="margin-bottom:0;">
  We appreciate your business and look forward to your next cleaning!
</p>`;

  return shell("Cleaning Complete", inner);
}

function renderReviewRequest(p: SendEmailParams): string {
  const inner = `
<h1 class="title">How Did We Do?</h1>
<p class="subtitle">Your feedback helps us grow and serve you better.</p>
<p class="greeting">Hi ${p.clientName},</p>
<p class="content">
  Thank you for choosing <span class="highlight">Tidy Home Co.</span>
  As a small local business, reviews mean everything to us. If you have a moment, we'd so appreciate
  a quick Google review — it helps other Waco families find us.
</p>
<p style="text-align:center;margin:0 0 24px 0;">
  <a href="${REVIEW_URL}" class="cta-btn">Leave a Google Review</a>
</p>
<p class="content" style="margin-bottom:0;">
  Thank you for being a part of the Tidy Home Co. family — we truly appreciate you!
</p>`;

  return shell("Review Request", inner);
}

/* ------------------------------------------------------------------ */
/*  Main render / send                                                */
/* ------------------------------------------------------------------ */

const SUBJECTS: Record<EmailTemplate, string> = {
  booking_confirmation: "You're booked! — Tidy Home Co.",
  upcoming_reminder: "Your upcoming cleaning with Tidy Home Co.",
  cleaning_complete: "Thank you from Tidy Home Co.",
  review_request: "How did we do? — Tidy Home Co.",
};

function renderHtml(params: SendEmailParams): { subject: string; html: string } {
  let html: string;
  switch (params.template) {
    case "booking_confirmation":
      html = renderBookingConfirmation(params);
      break;
    case "upcoming_reminder":
      html = renderUpcomingReminder(params);
      break;
    case "cleaning_complete":
      html = renderCleaningComplete(params);
      break;
    case "review_request":
      html = renderReviewRequest(params);
      break;
  }
  return { subject: SUBJECTS[params.template], html };
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
