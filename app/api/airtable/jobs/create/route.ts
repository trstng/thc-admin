import { NextResponse } from "next/server";
import { createRecord, TABLES, type JobFields } from "@/lib/airtable";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<JobFields>;
    if (!body["Linked Client"] || !body["Service Type"] || !body["Job Date"]) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    // Strip formula field just in case
    const { "Quoted Price": _ignore, ...rest } = body;
    void _ignore;
    const fields: Record<string, unknown> = {
      ...rest,
      "Job Status": rest["Job Status"] || "Scheduled",
      "Payment Status": rest["Payment Status"] || "Unpaid",
    };
    const record = await createRecord<JobFields>(TABLES.JOBS, fields);
    return NextResponse.json({ data: record });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Failed to create job", detail: message }, { status: 500 });
  }
}
