import asyncio
import logging

from services.airtable import TABLES, get_records, get_record, update_record
from services.automation_log import log as alog
from services.stripe_invoicing import ensure_customer, create_and_send_invoice

logger = logging.getLogger(__name__)


async def run_invoice_job() -> None:
    logger.info("invoice job: starting")
    try:
        jobs = await get_records(
            TABLES["JOBS"],
            filter_formula="AND({Job Status}='Completed',{Payment Status}!='Invoice Sent')",
        )
    except Exception:
        logger.exception("invoice job: failed to fetch jobs")
        return

    for job in jobs:
        f = job.get("fields", {})
        job_id = f.get("Job ID") or job["id"]
        job_record_id = job["id"]

        client_links: list[str] = f.get("Linked Client", [])
        if not client_links:
            logger.warning("invoice job: job %s has no linked client — skipping", job_id)
            continue

        try:
            client = await get_record(TABLES["CLIENTS"], client_links[0])
        except Exception:
            logger.exception("invoice job: could not fetch client for job %s", job_id)
            continue

        cf = client.get("fields", {})
        client_record_id = client["id"]
        client_name = cf.get("Name", "")

        if not cf.get("Invoice via Stripe"):
            logger.info("invoice job: client %s not flagged for Stripe — skipping", client_name)
            continue

        # Idempotency: skip if already logged
        try:
            existing_logs = await get_records(
                TABLES["AUTOMATIONS_LOG"],
                filter_formula=f"AND({{Job ID}}='{job_id}',{{Automation Type}}='Stripe Invoice')",
            )
            if existing_logs:
                logger.info("invoice job: already sent invoice for job %s — skipping", job_id)
                continue
        except Exception:
            logger.exception("invoice job: could not check automation log for job %s", job_id)
            continue

        amount = f.get("Quoted Price") or 0
        service_type = f.get("Service Type", "Cleaning Service")
        description = f"{service_type} — {f.get('Job Date', '')}"
        client_email = cf.get("Email")

        try:
            existing_stripe_id = cf.get("Stripe Customer ID")
            customer_id = ensure_customer(existing_stripe_id, client_name, client_email)

            if not existing_stripe_id or customer_id != existing_stripe_id:
                await update_record(TABLES["CLIENTS"], client_record_id, {"Stripe Customer ID": customer_id})

            result = create_and_send_invoice(customer_id, amount, description)

            await update_record(TABLES["JOBS"], job_record_id, {
                "Payment Status": "Invoice Sent",
                "Stripe Payment Link": result["invoice_url"],
            })

            await alog(
                client_name=client_name,
                job_id=job_id,
                automation_type="Stripe Invoice",
                channel="Stripe",
                status="Sent",
                client_record_id=client_record_id,
                job_record_id=job_record_id,
                note=f"Invoice {result['invoice_id']} created and sent",
            )
            logger.info("invoice job: sent invoice %s for job %s", result["invoice_id"], job_id)

        except Exception as exc:
            logger.exception("invoice job: failed for job %s", job_id)
            try:
                await alog(
                    client_name=client_name,
                    job_id=job_id,
                    automation_type="Stripe Invoice",
                    channel="Stripe",
                    status="Failed",
                    client_record_id=client_record_id,
                    job_record_id=job_record_id,
                    note=str(exc),
                )
            except Exception:
                pass

    logger.info("invoice job: done")


def run_invoice_job_sync() -> None:
    asyncio.run(run_invoice_job())
