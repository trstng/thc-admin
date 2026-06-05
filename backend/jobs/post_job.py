import asyncio
import logging
from datetime import datetime, timedelta

import pytz

_CDT = pytz.timezone("America/Chicago")

from services.airtable import TABLES, get_records, get_record, update_record
from services.automation_log import log as alog
from services.sendgrid import send_email
from services.twilio_sms import send_sms, build_sms

logger = logging.getLogger(__name__)


def _lookup(value) -> str:
    if isinstance(value, list):
        return value[0] if value else ""
    return value or ""


async def run_post_job_followup() -> None:
    yesterday = (datetime.now(tz=_CDT).date() - timedelta(days=1)).isoformat()
    logger.info("post_job: running for %s (yesterday's completed jobs)", yesterday)

    try:
        jobs = await get_records(
            TABLES["JOBS"],
            filter_formula=f"AND(DATETIME_FORMAT({{Job Date}},'YYYY-MM-DD')='{yesterday}',{{Job Status}}='Completed')",
        )
    except Exception:
        logger.exception("post_job: failed to fetch jobs")
        return

    logger.info("post_job: found %d job(s) for %s", len(jobs), yesterday)

    for job in jobs:
        f = job.get("fields", {})
        job_id = f.get("Job ID") or job["id"]
        job_record_id = job["id"]

        try:
            existing = await get_records(
                TABLES["AUTOMATIONS_LOG"],
                filter_formula=f"AND({{Job ID}}={job_id},{{Automation Type}}='Post-Job Follow-Up')",
            )
            if existing:
                logger.info("post_job: already sent for job %s — skipping", job_id)
                continue
        except Exception:
            logger.exception("post_job: log check failed for job %s", job_id)
            continue

        linked_clients = f.get("Linked Client", [])
        client_record_id = linked_clients[0] if linked_clients else None

        client_name = ""
        review_already_sent = False
        if client_record_id:
            try:
                client_rec = await get_record(TABLES["CLIENTS"], client_record_id)
                client_fields = client_rec.get("fields", {})
                client_name = client_fields.get("Full Name", "")
                review_already_sent = bool(client_fields.get("Review Sent?", False))
            except Exception:
                logger.warning("post_job: could not fetch client name for %s", client_record_id)

        client_email = _lookup(f.get("Client Email"))
        client_phone = f.get("Client Phone", "")

        logger.info("post_job: job %s | client=%s | email=%s", job_id, client_name, client_email)

        if not client_email:
            logger.warning("post_job: no email for job %s — skipping emails", job_id)
        else:
            for template in ("cleaning_complete", "review_request"):
                automation_type = "Post-Job Follow-Up" if template == "cleaning_complete" else "Review Request"
                if template == "review_request" and review_already_sent:
                    logger.info("post_job: review already sent for client %s — skipping", client_name)
                    continue
                try:
                    send_email(
                        to=client_email,
                        template=template,
                        client_name=client_name,
                    )
                    await alog(
                        client_name=client_name,
                        job_id=job_id,
                        automation_type=automation_type,
                        channel="Email",
                        status="Sent",
                        client_record_id=client_record_id,
                        job_record_id=job_record_id,
                    )
                    if template == "review_request" and client_record_id:
                        await update_record(TABLES["CLIENTS"], client_record_id, {"Review Sent?": True})
                except Exception as exc:
                    logger.exception("post_job: email failed for job %s template %s", job_id, template)
                    await alog(
                        client_name=client_name,
                        job_id=job_id,
                        automation_type=automation_type,
                        channel="Email",
                        status="Failed",
                        client_record_id=client_record_id,
                        job_record_id=job_record_id,
                        note=str(exc),
                    )

        if client_phone and not review_already_sent:
            body = build_sms("review", client_name)
            sent = send_sms(client_phone, body)
            if sent:
                await alog(
                    client_name=client_name,
                    job_id=job_id,
                    automation_type="Review Request",
                    channel="SMS",
                    status="Sent",
                    client_record_id=client_record_id,
                    job_record_id=job_record_id,
                )

    logger.info("post_job: done")


def run_post_job_followup_sync() -> None:
    asyncio.run(run_post_job_followup())
