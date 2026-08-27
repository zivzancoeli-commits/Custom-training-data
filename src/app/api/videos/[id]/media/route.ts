import path from "node:path";
import { NextResponse } from "next/server";
import { getVideo } from "@/lib/store";
import { videoDir } from "@/lib/paths";
import { extContentType, mediaResponse } from "@/lib/media-response";
import { existsSync } from "node:fs";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const video = await getVideo(id);
  if (!video) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const filePath = path.join(videoDir(id), video.filename);
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "Media missing." }, { status: 404 });
  }
  return mediaResponse(filePath, request, extContentType(video.filename));
}
