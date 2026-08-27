import { NextResponse } from "next/server";
import { readDataset } from "@/lib/store";
import { exportDataset, EXPORT_FORMATS } from "@/lib/export";
import type { ExportFormat } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const format = (url.searchParams.get("format") ?? "openai") as ExportFormat;
  const allowed = EXPORT_FORMATS.some((f) => f.id === format);
  if (!allowed) {
    return NextResponse.json({ error: "Unknown export format." }, { status: 400 });
  }
  const dataset = await readDataset();
  if (!dataset || dataset.examples.length === 0) {
    return NextResponse.json({ error: "Build a dataset first." }, { status: 404 });
  }
  const { body, filename, mime } = exportDataset(dataset.examples, format);
  return new NextResponse(body, {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
