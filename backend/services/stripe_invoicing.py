import os
import stripe
from dotenv import load_dotenv

load_dotenv()

stripe.api_key = os.environ["STRIPE_SECRET_KEY"]

_IS_TEST = (os.getenv("STRIPE_SECRET_KEY", "")).startswith("sk_test")


def ensure_customer(existing_id: str | None, name: str, email: str | None) -> str:
    if existing_id:
        try:
            c = stripe.Customer.retrieve(existing_id)
            if not c.get("deleted"):
                return existing_id
        except stripe.InvalidRequestError:
            pass
    kwargs: dict = {"name": name}
    if email:
        kwargs["email"] = email
    return stripe.Customer.create(**kwargs).id


def create_and_send_invoice(
    stripe_customer_id: str,
    amount_dollars: float,
    description: str,
) -> dict:
    invoice = stripe.Invoice.create(
        customer=stripe_customer_id,
        auto_advance=False,
        collection_method="send_invoice",
        days_until_due=7,
        description=description,
    )
    stripe.InvoiceItem.create(
        customer=stripe_customer_id,
        invoice=invoice.id,
        amount=round(amount_dollars * 100),
        currency="usd",
        description=description,
    )
    finalized = stripe.Invoice.finalize_invoice(invoice.id)
    stripe.Invoice.send_invoice(finalized.id)
    dashboard_base = "https://dashboard.stripe.com" + ("/test" if _IS_TEST else "")
    url = finalized.hosted_invoice_url or f"{dashboard_base}/invoices/{finalized.id}"
    return {"invoice_id": finalized.id, "invoice_url": url}
