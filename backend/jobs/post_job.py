import asyncio
import logging
from datetime import date, timedelta

from services.airtable import TABLES, get_records
from services.automation_log import log as alog
from services.sendgrid import send_email
from services.twilio_sms import send_sms, build_sms

logger = logging.getLogger(__name__)


async def run_post_job_followup() -> None:
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    logger.info("post_job: running for %s (yesterday's completed jobs)", yesterday)

    try:
        jobs = await get_records(
            TABLES["JOBS"],
            filter_formula=f"AND({{Job Date}}='{yesterday}',{{Job Status}}='Completed')",
        )
    except Exception:
        logger.exception("post_job: failed to fetch jobs")
        return

    for job in jobs:
        f = job.get("fields", {})
        job_id = f.get("Job ID") or job["id"]
        job_record_id = job["id"]

        try:
            existing = await get_records(
                TABLES["AUTOMATIONS_LOG"],
                filter_formula=f"AND({{Job ID}}='{job_id}',{{Automation Type}}='Post-Job Follow-Up')",
            )
            if existing:
                logger.info("post_job: already sent for job %s — skipping", job_id)
                continue
        except Exception:
            logger.exception("post_job: log check failed for job %s", job_id)
            continue

        client_name = (f.get("Client Name (from Linked Client)") or [""])[0] if isinstance(f.get("Client Name (from Linked Client)"), list) else f.get("Client Name (from Linked Client)", "")
        client_email_raw = f.get("Client Email (from Linked Client)")
        client_email = (client_email_raw[0] if isinstance(client_email_raw, list) else client_email_raw) or ""
        client_phone = f.get("Client Phone", "")
        client_record_ids: list[str] = f.get("Linked Client", [])
        client_record_id = client_record_ids[0] if client_record_ids else None

        if not client_email:
            logger.warning("post_job: no email for job %s — skipping emails", job_id)
        else:
            for template in ("cleaning_complete", "review_request"):
                try:
                    send_email(
                        to=client_email,
                        template=template,
                        client_name=client_name,
                    )
                    await alog(
                        client_name=client_name,
                        job_id=job_id,
                        automation_type="Post-Job Follow-Up" if template == "cleaning_complete" else "Review Request",
                        channel="Email",
                        status="Sent",
                        client_record_id=client_record_id,
                        job_record_id=job_record_id,
                    )
                except Exception as exc:
                    logger.exception("post_job: email failed for job %s template %s", job_id, template)
                    await alog(
                        client_name=client_name,
                        job_id=job_id,
                        automation_type="Post-Job Follow-Up" if template == "cleaning_complete" else "Review Request",
                        channel="Email",
                        status="Failed",
                        client_record_id=client_record_id,
                        job_record_id=job_record_id,
                        note=str(exc),
                    )

        if client_phone:
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
