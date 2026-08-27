import { NextResponse } from "next/server";
import { createSampleLecture } from "@/lib/sample";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST() {
  try {
    const video = await createSampleLecture();
    return NextResponse.json({ video });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
