import logging
import pytz
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from jobs.reminders import run_reminder_job_sync
from jobs.post_job import run_post_job_followup_sync
from jobs.invoice import run_invoice_job_sync

logger = logging.getLogger(__name__)

_CDT = pytz.timezone("America/Chicago")


def start_scheduler() -> BackgroundScheduler:
    s = BackgroundScheduler(timezone=_CDT)
    s.add_job(
        run_reminder_job_sync,
        CronTrigger(hour=8, minute=0, timezone=_CDT),
        id="reminders",
        name="8 AM reminder emails/SMS",
        misfire_grace_time=300,
    )
    s.add_job(
        run_post_job_followup_sync,
        CronTrigger(hour=18, minute=0, timezone=_CDT),
        id="post_job",
        name="6 PM post-job follow-up",
        misfire_grace_time=300,
    )
    s.add_job(
        run_invoice_job_sync,
        IntervalTrigger(minutes=30),
        id="invoice",
        name="Stripe invoicing (every 30 min)",
    )
    s.start()
    logger.info("Scheduler started — 3 jobs registered")
    return s
