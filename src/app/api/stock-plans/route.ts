import { NextResponse } from "next/server";
import { saveStockPlan, type StockPlanInput } from "@/lib/oracle";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as StockPlanInput;
    const data = await saveStockPlan(payload);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Unable to save stock plan.", message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const payload = (await request.json()) as StockPlanInput;
    const data = await saveStockPlan(payload);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Unable to update stock plan.", message }, { status: 500 });
  }
}