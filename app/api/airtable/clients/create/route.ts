import { NextResponse } from "next/server";
import { createRecord, TABLES, type ClientFields } from "@/lib/airtable";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<ClientFields>;
    if (!body["Full Name"]) {
      return NextResponse.json({ error: "Full Name is required" }, { status: 400 });
    }
    const record = await createRecord<ClientFields>(TABLES.CLIENTS, body as Record<string, unknown>);
    return NextResponse.json({ data: record });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Failed to create client", detail: message }, { status: 500 });
  }
}
