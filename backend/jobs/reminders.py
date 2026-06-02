import asyncio
import logging
from datetime import date, timedelta

from services.airtable import TABLES, get_records
from services.automation_log import log as alog
from services.sendgrid import send_email
from services.twilio_sms import send_sms, build_sms

logger = logging.getLogger(__name__)


async def run_reminder_job() -> None:
    tomorrow = (date.today() + timedelta(days=1)).isoformat()
    logger.info("reminders: running for %s", tomorrow)

    try:
        jobs = await get_records(
            TABLES["JOBS"],
            filter_formula=f"AND({{Job Date}}='{tomorrow}',{{Job Status}}='Scheduled')",
        )
    except Exception:
        logger.exception("reminders: failed to fetch jobs")
        return

    for job in jobs:
        f = job.get("fields", {})
        job_id = f.get("Job ID") or job["id"]
        job_record_id = job["id"]

        try:
            existing = await get_records(
                TABLES["AUTOMATIONS_LOG"],
                filter_formula=f"AND({{Job ID}}='{job_id}',{{Automation Type}}='Appointment Reminder')",
            )
            if existing:
                logger.info("reminders: already sent for job %s — skipping", job_id)
                continue
        except Exception:
            logger.exception("reminders: log check failed for job %s", job_id)
            continue

        client_name = (f.get("Client Name (from Linked Client)") or [""])[0] if isinstance(f.get("Client Name (from Linked Client)"), list) else f.get("Client Name (from Linked Client)", "")
        client_email_raw = f.get("Client Email (from Linked Client)")
        client_email = (client_email_raw[0] if isinstance(client_email_raw, list) else client_email_raw) or ""
        client_phone = f.get("Client Phone", "")
        job_date = f.get("Job Date", "")
        job_time = f.get("Start Time", "")
        address = f.get("Service Address", "")
        client_record_ids: list[str] = f.get("Linked Client", [])
        client_record_id = client_record_ids[0] if client_record_ids else None

        if not client_email:
            logger.warning("reminders: no email for job %s — skipping email", job_id)
        else:
            try:
                send_email(
                    to=client_email,
                    template="upcoming_reminder",
                    client_name=client_name,
                    job_date=job_date,
                    job_time=job_time,
                    address=address,
                )
                await alog(
                    client_name=client_name,
                    job_id=job_id,
                    automation_type="Appointment Reminder",
                    channel="Email",
                    status="Sent",
                    client_record_id=client_record_id,
                    job_record_id=job_record_id,
                )
            except Exception as exc:
                logger.exception("reminders: email failed for job %s", job_id)
                await alog(
                    client_name=client_name,
                    job_id=job_id,
                    automation_type="Appointment Reminder",
                    channel="Email",
                    status="Failed",
                    client_record_id=client_record_id,
                    job_record_id=job_record_id,
                    note=str(exc),
                )

        if client_phone:
            body = build_sms("reminder", client_name, time=job_time, address=address)
            sent = send_sms(client_phone, body)
            if sent:
                await alog(
                    client_name=client_name,
                    job_id=job_id,
                    automation_type="Appointment Reminder",
                    channel="SMS",
                    status="Sent",
                    client_record_id=client_record_id,
                    job_record_id=job_record_id,
                )

    logger.info("reminders: done")


def run_reminder_job_sync() -> None:
    asyncio.run(run_reminder_job())
