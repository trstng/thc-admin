import { NextResponse } from "next/server";
import { ensureCustomer, createDraftInvoice } from "@/lib/stripe";
import { updateRecord, TABLES, type ClientFields } from "@/lib/airtable";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      clientRecordId: string;
      clientName: string;
      clientEmail?: string;
      existingStripeCustomerId?: string;
      jobRecordId?: string;
      amount: number;
      serviceType?: string;
      description: string;
    };

    if (!body.clientRecordId || !body.clientName || !body.amount || !body.description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const customerId = await ensureCustomer({
      existingId: body.existingStripeCustomerId,
      name: body.clientName,
      email: body.clientEmail,
    });

    // Save Stripe Customer ID back to Airtable if new
    if (!body.existingStripeCustomerId || customerId !== body.existingStripeCustomerId) {
      try {
        await updateRecord<ClientFields>(TABLES.CLIENTS, body.clientRecordId, {
          "Stripe Customer ID": customerId,
        });
      } catch {
        // non-fatal
      }
    }

    const { invoiceId, invoiceUrl } = await createDraftInvoice({
      stripeCustomerId: customerId,
      amount: body.amount,
      description: body.description,
      serviceType: body.serviceType,
    });

    // Update job payment status if we have a job ref
    if (body.jobRecordId) {
      try {
        await updateRecord(TABLES.JOBS, body.jobRecordId, {
          "Payment Status": "Invoice Sent",
          "Stripe Payment Link": invoiceUrl,
        });
      } catch {
        // non-fatal
      }
    }

    return NextResponse.json({ ok: true, invoiceId, invoiceUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Failed to create invoice", detail: message }, { status: 500 });
  }
}
