import { writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getVideo, upsertVideo } from "@/lib/store";
import { videoDir } from "@/lib/paths";
import { parseCaptions, toSrt } from "@/lib/captions";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const video = await getVideo(id);
  if (!video) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const body = (await request.json()) as { text?: string };
  const text = body.text?.trim() ?? "";
  if (text.length < 20) {
    return NextResponse.json(
      { error: "Paste at least a couple of sentences." },
      { status: 400 }
    );
  }
  const cues = parseCaptions(text, "captions.txt");
  await writeFile(path.join(videoDir(id), "captions.srt"), toSrt(cues), "utf8");
  video.cues = cues;
  video.captionSource = "pasted";
  video.status = "transcribed";
  video.error = undefined;
  await upsertVideo(video);
  return NextResponse.json({ video });
}
