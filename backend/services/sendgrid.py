import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from dotenv import load_dotenv

load_dotenv()

_API_KEY = os.environ["SENDGRID_API_KEY"]
FROM_EMAIL = os.getenv("SENDGRID_FROM_EMAIL", "team@tidyhomecompany.com")
FROM_NAME = "Tidy Home Co."
LOGO_URL = "https://vtxz5y44w6e4isy6.public.blob.vercel-storage.com/PNG%20image.png"
REVIEW_URL = "https://g.page/r/CTgFJRq3M-f-EBM/review"

SUBJECTS = {
    "upcoming_reminder":    "Your upcoming cleaning with Tidy Home Co.",
    "booking_confirmation": "You're booked! — Tidy Home Co.",
    "cleaning_complete":    "Thank you from Tidy Home Co.",
    "review_request":       "How did we do? — Tidy Home Co.",
}


def _shell(content: str) -> str:
    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Tidy Home Co.</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">
        <tr>
          <td style="background:#1a1a2e;padding:24px 32px;text-align:center;">
            <img src="{LOGO_URL}" alt="Tidy Home Co." height="48"
                 style="display:block;margin:0 auto;"/>
          </td>
        </tr>
        <tr><td style="padding:32px;">{content}</td></tr>
        <tr>
          <td style="background:#f4f4f5;padding:16px 32px;text-align:center;
                     font-size:12px;color:#6b7280;">
            &copy; Tidy Home Co. &bull; team@tidyhomecompany.com
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
"""


def _detail_row(label: str, value: str) -> str:
    return f"""
<tr>
  <td style="padding:6px 0;font-size:14px;color:#6b7280;width:140px;">{label}</td>
  <td style="padding:6px 0;font-size:14px;color:#1a1a2e;font-weight:600;">{value}</td>
</tr>
"""


def _details_box(rows: str) -> str:
    return f"""
<table cellpadding="0" cellspacing="0"
       style="background:#f9fafb;border-radius:6px;padding:16px 20px;margin:20px 0;width:100%;">
  {rows}
</table>
"""


def _checklist_box(items: list[str]) -> str:
    lis = "".join(
        f'<li style="margin:6px 0;font-size:14px;color:#374151;">{item}</li>'
        for item in items
    )
    return f'<ul style="padding-left:20px;margin:16px 0;">{lis}</ul>'


def _build_html(
    template: str,
    client_name: str,
    job_date: str | None,
    job_time: str | None,
    address: str | None,
    quote: str | None,
) -> str:
    first = client_name.split()[0] if client_name else "there"

    if template == "upcoming_reminder":
        rows = _detail_row("Date", job_date or "") + _detail_row("Time", job_time or "") + _detail_row("Address", address or "")
        content = f"""
<h2 style="color:#1a1a2e;margin:0 0 8px;">See you tomorrow, {first}!</h2>
<p style="color:#374151;font-size:15px;margin:0 0 16px;">
  Just a friendly reminder that your cleaning is scheduled for tomorrow.
</p>
{_details_box(rows)}
<p style="color:#374151;font-size:14px;">
  Questions? Reply to this email or reach us at team@tidyhomecompany.com.
</p>
"""

    elif template == "booking_confirmation":
        rows = _detail_row("Date", job_date or "") + _detail_row("Time", job_time or "") + _detail_row("Address", address or "") + (_detail_row("Quoted Price", quote) if quote else "")
        content = f"""
<h2 style="color:#1a1a2e;margin:0 0 8px;">You're booked, {first}!</h2>
<p style="color:#374151;font-size:15px;margin:0 0 16px;">
  Thank you for choosing Tidy Home Co. Here are your booking details:
</p>
{_details_box(rows)}
{_checklist_box(["Clear countertops of personal items", "Secure pets during the clean", "Ensure cleaners have access to the property"])}
<p style="color:#374151;font-size:14px;">
  We look forward to making your home shine!
</p>
"""

    elif template == "cleaning_complete":
        content = f"""
<h2 style="color:#1a1a2e;margin:0 0 8px;">Your home is sparkling, {first}!</h2>
<p style="color:#374151;font-size:15px;margin:0 0 16px;">
  We just finished your cleaning — we hope everything looks great.
</p>
<p style="color:#374151;font-size:14px;">
  If anything didn't meet your expectations, please let us know within 24 hours
  and we'll make it right.
</p>
<p style="color:#374151;font-size:14px;">
  Thank you for trusting Tidy Home Co. with your home!
</p>
"""

    elif template == "review_request":
        content = f"""
<h2 style="color:#1a1a2e;margin:0 0 8px;">How did we do, {first}?</h2>
<p style="color:#374151;font-size:15px;margin:0 0 16px;">
  We'd love to hear your feedback! If you enjoyed your cleaning, a quick Google
  review goes a long way in helping us grow.
</p>
<table cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td style="background:#1a1a2e;border-radius:6px;padding:12px 24px;">
      <a href="{REVIEW_URL}"
         style="color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
        Leave a Google Review ★
      </a>
    </td>
  </tr>
</table>
<p style="color:#374151;font-size:14px;">
  It only takes 30 seconds and means the world to us. Thank you!
</p>
"""
    else:
        raise ValueError(f"Unknown template: {template}")

    return _shell(content)


def send_email(
    to: str,
    template: str,
    client_name: str,
    job_date: str | None = None,
    job_time: str | None = None,
    address: str | None = None,
    quote: str | None = None,
) -> None:
    html = _build_html(template, client_name, job_date, job_time, address, quote)
    subject = SUBJECTS[template]
    message = Mail(
        from_email=(FROM_EMAIL, FROM_NAME),
        to_emails=to,
        subject=subject,
        html_content=html,
    )
    sg = SendGridAPIClient(_API_KEY)
    sg.send(message)
