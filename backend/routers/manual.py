from fastapi import APIRouter, HTTPException
from models.schemas import EmailRequest, SmsRequest
from services.sendgrid import send_email
from services.twilio_sms import send_sms, build_sms

router = APIRouter(prefix="/send")


@router.post("/email")
def send_email_route(body: EmailRequest):
    try:
        send_email(
            to=body.to,
            template=body.template,
            client_name=body.clientName,
            job_date=body.jobDate,
            job_time=body.jobTime,
            address=body.address,
            quote=body.quote,
        )
        return {"ok": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/sms")
def send_sms_route(body: SmsRequest):
    sms_body = build_sms(
        template=body.template,
        name=body.clientName,
        time=body.jobTime or "",
        address=body.address or "",
    )
    sent = send_sms(body.to, sms_body)
    if not sent:
        raise HTTPException(status_code=503, detail="SMS not configured — Twilio keys missing")
    return {"ok": True}
