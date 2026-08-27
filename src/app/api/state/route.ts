import { NextResponse } from "next/server";
import { readDataset, readIndex, readJob } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const [{ videos }, dataset, job] = await Promise.all([
    readIndex(),
    readDataset(),
    readJob(),
  ]);
  return NextResponse.json({ videos, dataset, job });
}
