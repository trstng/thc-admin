import { NextResponse } from "next/server";
import { getRecords, TABLES, type JobFields } from "@/lib/airtable";

export const revalidate = 0;

export async function GET() {
  try {
    const records = await getRecords<JobFields>(TABLES.JOBS, {
      pageSize: 100,
      sort: [{ field: "Job Date", direction: "desc" }],
    });
    return NextResponse.json({ data: records });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Failed to fetch jobs", detail: message }, { status: 500 });
  }
}
