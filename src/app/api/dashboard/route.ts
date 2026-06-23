import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/oracle";

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await getDashboardData();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Unable to load the dashboard.", message },
      { status: 500 },
    );
  }
}
