import { NextResponse } from "next/server";
import { saveCompany, type CompanyInput } from "@/lib/oracle";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CompanyInput;
    const data = await saveCompany(payload);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Unable to save company.", message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const payload = (await request.json()) as CompanyInput;
    const data = await saveCompany(payload);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Unable to update company.", message }, { status: 500 });
  }
}