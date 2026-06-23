import { NextResponse } from "next/server";
import { saveEmployee, type EmployeeInput } from "@/lib/oracle";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as EmployeeInput;
    const data = await saveEmployee(payload);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Unable to save employee.", message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const payload = (await request.json()) as EmployeeInput;
    const data = await saveEmployee(payload);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Unable to update employee.", message }, { status: 500 });
  }
}