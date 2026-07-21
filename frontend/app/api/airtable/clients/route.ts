import { NextResponse } from "next/server";
import { getRecords, TABLES, type ClientFields } from "@/lib/airtable";

export const revalidate = 30;

export async function GET() {
  try {
    const records = await getRecords<ClientFields>(TABLES.CLIENTS, {
      pageSize: 100,
    });
    return NextResponse.json({ data: records });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Failed to fetch clients", detail: message }, { status: 500 });
  }
}
