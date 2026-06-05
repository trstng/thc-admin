import logging
import os
import re
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER")

REVIEW_URL = "https://g.page/r/CTgFJRq3M-f-EBM/review"

# TEST MODE — redirect all SMS to owner for verification. Remove when going live.
_TEST_PHONE_OVERRIDE = "+12542270542"

SMS_TEMPLATES = {
    "reminder": (
        "Hi {name}, just a reminder your cleaning is tomorrow at {time} at {address}. "
        "— Tidy Home Co. Reply STOP to opt out."
    ),
    "review": (
        "Hi {name}, thank you for choosing Tidy Home Co.! "
        f"We'd love a quick Google review: {REVIEW_URL}"
    ),
}


def _normalize_phone(raw: str) -> str:
    digits = re.sub(r"\D", "", raw)
    if len(digits) == 10:
        digits = "1" + digits
    return f"+{digits}" if digits else ""


def send_sms(to: str, body: str) -> bool:
    if not all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER]):
        logger.warning("Twilio env vars not set — SMS skipped")
        return False
    to = _TEST_PHONE_OVERRIDE  # TEST MODE — remove when going live
    normalized = _normalize_phone(to)
    if not normalized:
        logger.warning("send_sms: could not normalize phone number %r — skipping", to)
        return False
    from twilio.rest import Client
    client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    client.messages.create(to=normalized, from_=TWILIO_FROM_NUMBER, body=body)
    return True


def build_sms(template: str, name: str, time: str = "", address: str = "") -> str:
    first = name.split()[0] if name else "there"
    tmpl = SMS_TEMPLATES[template]
    return tmpl.format(name=first, time=time, address=address)
