import path from "node:path";
import { existsSync } from "node:fs";
import { NextResponse } from "next/server";
import { getVideo } from "@/lib/store";
import { videoDir } from "@/lib/paths";
import { mediaResponse } from "@/lib/media-response";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string; n: string }> }
) {
  const { id, n } = await ctx.params;
  const video = await getVideo(id);
  if (!video) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const filePath = path.join(videoDir(id), `thumb-${n}.jpg`);
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "No still." }, { status: 404 });
  }
  return mediaResponse(filePath, request, "image/jpeg");
}
