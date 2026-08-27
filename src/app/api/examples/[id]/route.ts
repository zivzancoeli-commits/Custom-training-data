import { NextResponse } from "next/server";
import { readDataset, writeDataset } from "@/lib/store";
import type { TrainingExample } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const dataset = await readDataset();
  if (!dataset) return NextResponse.json({ error: "No dataset yet." }, { status: 404 });
  const example = dataset.examples.find((e) => e.id === id);
  if (!example) return NextResponse.json({ error: "Example not found." }, { status: 404 });

  const body = (await request.json()) as Partial<
    Pick<TrainingExample, "kept" | "instruction" | "input" | "output">
  >;
  if (typeof body.kept === "boolean") example.kept = body.kept;
  if (typeof body.instruction === "string") example.instruction = body.instruction;
  if (typeof body.input === "string") example.input = body.input;
  if (typeof body.output === "string") {
    example.output = body.output;
    const last = example.messages[example.messages.length - 1];
    if (last?.role === "assistant") last.content = body.output;
  }
  if (typeof body.instruction === "string" || typeof body.input === "string") {
    const user = example.messages.find((m) => m.role === "user");
    if (user) {
      user.content = example.input
        ? `${example.instruction}\n\n${example.input}`
        : example.instruction;
    }
  }
  await writeDataset(dataset);
  return NextResponse.json({ example });
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const dataset = await readDataset();
  if (!dataset) return NextResponse.json({ error: "No dataset yet." }, { status: 404 });
  const before = dataset.examples.length;
  dataset.examples = dataset.examples.filter((e) => e.id !== id);
  if (dataset.examples.length === before) {
    return NextResponse.json({ error: "Example not found." }, { status: 404 });
  }
  await writeDataset(dataset);
  return NextResponse.json({ ok: true });
}
