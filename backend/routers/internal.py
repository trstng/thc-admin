import os
from fastapi import APIRouter, Header, HTTPException

from jobs.reminders import run_reminder_job_sync
from jobs.post_job import run_post_job_followup_sync
from jobs.invoice import run_invoice_job_sync

router = APIRouter(prefix="/internal")

_SECRET = os.getenv("INTERNAL_SECRET", "")


def _check_secret(x_internal_secret: str | None) -> None:
    if not _SECRET or x_internal_secret != _SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")


@router.post("/run-reminders")
def run_reminders(x_internal_secret: str | None = Header(default=None)):
    _check_secret(x_internal_secret)
    run_reminder_job_sync()
    return {"ok": True}


@router.post("/run-post-job")
def run_post_job(x_internal_secret: str | None = Header(default=None)):
    _check_secret(x_internal_secret)
    run_post_job_followup_sync()
    return {"ok": True}


@router.post("/run-invoices")
def run_invoices(x_internal_secret: str | None = Header(default=None)):
    _check_secret(x_internal_secret)
    run_invoice_job_sync()
    return {"ok": True}
