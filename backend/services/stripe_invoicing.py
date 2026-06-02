import os
import stripe
from dotenv import load_dotenv

load_dotenv()

stripe.api_key = os.environ["STRIPE_SECRET_KEY"]

_IS_TEST = (os.getenv("STRIPE_SECRET_KEY", "")).startswith("sk_test")

# TEST MODE — all invoices go to owner. Remove the override lines when going live.
_TEST_CUSTOMER_NAME = "Tgonz Test"
_TEST_CUSTOMER_EMAIL = "tgonz.98@gmail.com"


def ensure_customer(existing_id: str | None, name: str, email: str | None) -> str:
    # TEST MODE — ignore real client, always use test customer. Remove when going live.
    name, email = _TEST_CUSTOMER_NAME, _TEST_CUSTOMER_EMAIL

    existing = stripe.Customer.search(query=f'email:"{email}"').data
    if existing:
        return existing[0].id
    return stripe.Customer.create(name=name, email=email).id


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
