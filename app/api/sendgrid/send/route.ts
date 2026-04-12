import { NextResponse } from "next/server";
import { sendEmail, templateToLogType, type EmailTemplate } from "@/lib/sendgrid";
import { createRecord, TABLES } from "@/lib/airtable";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      to: string;
      template: EmailTemplate;
      clientName: string;
      jobDate?: string;
      jobTime?: string;
      address?: string;
      quote?: string;
      clientRecordId?: string;
      jobRecordId?: string;
    };

    if (!body.to || !body.template || !body.clientName) {
      return NextResponse.json({ error: "Missing to/template/clientName" }, { status: 400 });
    }

    await sendEmail({
      to: body.to,
      template: body.template,
      clientName: body.clientName,
      jobDate: body.jobDate,
      jobTime: body.jobTime,
      address: body.address,
      quote: body.quote,
    });

    // Log to Automations Log
    try {
      const logFields: Record<string, unknown> = {
        "Client Name": body.clientName,
        "Automation Type": templateToLogType(body.template),
        Channel: "Email",
        Status: "Sent",
        "Automation Note": `Sent ${body.template} to ${body.to}`,
      };
      if (body.clientRecordId) logFields["Related Client (Linked)"] = [body.clientRecordId];
      if (body.jobRecordId) logFields["Related Job (Linked)"] = [body.jobRecordId];
      await createRecord(TABLES.AUTOMATIONS_LOG, logFields);
    } catch {
      // Non-fatal: email sent but log failed
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Failed to send email", detail: message }, { status: 500 });
  }
}
