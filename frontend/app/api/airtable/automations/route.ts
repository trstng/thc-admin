import { NextResponse } from "next/server";
import { getRecords, TABLES, type AutomationLogFields } from "@/lib/airtable";

export const revalidate = 30;

export async function GET() {
  try {
    const records = await getRecords<AutomationLogFields>(TABLES.AUTOMATIONS_LOG, {
      pageSize: 100,
      maxRecords: 200,
    });
    return NextResponse.json({ data: records });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Failed to fetch automations", detail: message }, { status: 500 });
  }
}
