import logging
import os
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER")

REVIEW_URL = "https://g.page/r/CTgFJRq3M-f-EBM/review"

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


def send_sms(to: str, body: str) -> bool:
    if not all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER]):
        logger.warning("Twilio env vars not set — SMS skipped")
        return False
    from twilio.rest import Client
    client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    client.messages.create(to=to, from_=TWILIO_FROM_NUMBER, body=body)
    return True


def build_sms(template: str, name: str, time: str = "", address: str = "") -> str:
    first = name.split()[0] if name else "there"
    tmpl = SMS_TEMPLATES[template]
    return tmpl.format(name=first, time=time, address=address)
