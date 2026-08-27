import { NextResponse } from "next/server";
import { DEFAULT_SETTINGS, type ProcessSettings } from "@/lib/types";
import { isProcessing, startProcess } from "@/lib/process";
import { readJob } from "@/lib/store";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET() {
  const job = await readJob();
  return NextResponse.json({ job, running: isProcessing() });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Partial<ProcessSettings>;
  const settings: ProcessSettings = { ...DEFAULT_SETTINGS, ...body };
  const job = await startProcess(settings);
  return NextResponse.json({ job, running: true });
}
