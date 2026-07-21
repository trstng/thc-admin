import { NextResponse } from "next/server";
import { getRecords, TABLES, type PaymentFields } from "@/lib/airtable";

export const revalidate = 30;

export async function GET() {
  try {
    const records = await getRecords<PaymentFields>(TABLES.PAYMENTS, {
      pageSize: 100,
    });
    return NextResponse.json({ data: records });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Failed to fetch payments", detail: message }, { status: 500 });
  }
}
