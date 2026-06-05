import asyncio
import logging
from datetime import date, datetime, timedelta

import pytz

from services.airtable import TABLES, get_records, get_record
from services.automation_log import log as alog
from services.sendgrid import send_email
from services.twilio_sms import send_sms, build_sms

logger = logging.getLogger(__name__)

_CDT = pytz.timezone("America/Chicago")


def _fmt_time(iso: str) -> str:
    if not iso:
        return ""
    try:
        # Airtable returns times in the workspace timezone with a misleading Z suffix — strip it
        # and format as-is rather than converting from UTC.
        dt = datetime.fromisoformat(iso.replace("Z", ""))
        return dt.strftime("%-I:%M %p")
    except Exception:
        return iso


def _lookup(value) -> str:
    if isinstance(value, list):
        return value[0] if value else ""
    return value or ""


async def run_reminder_job() -> None:
    tomorrow = (datetime.now(tz=_CDT).date() + timedelta(days=1)).isoformat()
    logger.info("reminders: running for %s", tomorrow)

    try:
        jobs = await get_records(
            TABLES["JOBS"],
            filter_formula=f"AND(DATETIME_FORMAT({{Job Date}},'YYYY-MM-DD')='{tomorrow}',{{Job Status}}='Scheduled')",
        )
    except Exception:
        logger.exception("reminders: failed to fetch jobs")
        return

    logger.info("reminders: found %d job(s) for %s", len(jobs), tomorrow)

    for job in jobs:
        f = job.get("fields", {})
        job_id = f.get("Job ID") or job["id"]
        job_record_id = job["id"]

        try:
            existing = await get_records(
                TABLES["AUTOMATIONS_LOG"],
                filter_formula=f"AND({{Job ID}}={job_id},{{Automation Type}}='Appointment Reminder')",
            )
            if existing:
                logger.info("reminders: already sent for job %s — skipping", job_id)
                continue
        except Exception:
            logger.exception("reminders: log check failed for job %s", job_id)
            continue

        linked_clients = f.get("Linked Client", [])
        client_record_id = linked_clients[0] if linked_clients else None

        client_name = ""
        if client_record_id:
            try:
                client_rec = await get_record(TABLES["CLIENTS"], client_record_id)
                client_name = client_rec.get("fields", {}).get("Full Name", "")
            except Exception:
                logger.warning("reminders: could not fetch client name for %s", client_record_id)

        client_email = _lookup(f.get("Client Email"))
        client_phone = f.get("Client Phone", "")
        job_date = f.get("Job Date", "")
        job_time = _fmt_time(f.get("Job Time", ""))
        address = _lookup(f.get("Client Address"))

        logger.info("reminders: job %s | client=%s | email=%s | time=%s", job_id, client_name, client_email, job_time)

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
