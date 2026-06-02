import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = secretKey
  ? new Stripe(secretKey)
  : (null as unknown as Stripe);

function requireStripe(): Stripe {
  if (!stripe) throw new Error("STRIPE_SECRET_KEY is not set");
  return stripe;
}

export async function ensureCustomer(params: {
  existingId?: string;
  name: string;
  email?: string;
}): Promise<string> {
  const s = requireStripe();
  if (params.existingId) {
    try {
      const existing = await s.customers.retrieve(params.existingId);
      if (!(existing as Stripe.DeletedCustomer).deleted) {
        return params.existingId;
      }
    } catch {
      // fall through and create fresh
    }
  }
  const created = await s.customers.create({
    name: params.name,
    email: params.email,
  });
  return created.id;
}

export async function createDraftInvoice(params: {
  stripeCustomerId: string;
  amount: number; // dollars
  description: string;
  serviceType?: string;
}): Promise<{ invoiceId: string; invoiceUrl: string }> {
  const s = requireStripe();
  const amountCents = Math.round(params.amount * 100); // cents

  // 1. Draft invoice first
  const invoice = await s.invoices.create({
    customer: params.stripeCustomerId,
    auto_advance: false,
    collection_method: "send_invoice",
    days_until_due: 7,
    description: params.description,
  });

  // 2. Attach a flat invoice item — NO quantity param, per plan notes.
  //    Pass the full amount directly instead of creating a separate price.
  await s.invoiceItems.create({
    customer: params.stripeCustomerId,
    invoice: invoice.id,
    amount: amountCents,
    currency: "usd",
    description: params.description,
  });

  // Refresh invoice to pick up totals
  const finalInvoice = await s.invoices.retrieve(invoice.id!);
  const dashboardUrl = `https://dashboard.stripe.com${secretKey?.includes("sk_test") ? "/test" : ""}/invoices/${finalInvoice.id}`;

  return {
    invoiceId: finalInvoice.id!,
    invoiceUrl: finalInvoice.hosted_invoice_url || dashboardUrl,
  };
}
