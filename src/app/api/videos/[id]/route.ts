import { NextResponse } from "next/server";
import { deleteVideo, getVideo, upsertVideo } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const video = await getVideo(id);
  if (!video) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ video });
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const video = await getVideo(id);
  if (!video) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const body = (await request.json()) as { title?: string };
  if (typeof body.title === "string" && body.title.trim()) {
    video.title = body.title.trim();
    await upsertVideo(video);
  }
  return NextResponse.json({ video });
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const video = await getVideo(id);
  if (!video) return NextResponse.json({ error: "Not found." }, { status: 404 });
  await deleteVideo(id);
  return NextResponse.json({ ok: true });
}
