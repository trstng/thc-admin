from typing import Literal
from pydantic import BaseModel


class EmailRequest(BaseModel):
    to: str
    template: Literal["upcoming_reminder", "booking_confirmation", "cleaning_complete", "review_request"]
    clientName: str
    jobDate: str | None = None
    jobTime: str | None = None
    address: str | None = None
    quote: str | None = None


class SmsRequest(BaseModel):
    to: str
    template: Literal["reminder", "review"]
    clientName: str
    jobDate: str | None = None
    jobTime: str | None = None
    address: str | None = None
