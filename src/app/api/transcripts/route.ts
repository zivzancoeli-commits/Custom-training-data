import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { parseCaptions, toSrt } from "@/lib/captions";
import { videoDir } from "@/lib/paths";
import { upsertVideo } from "@/lib/store";
import type { VideoRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as { title?: string; text?: string };
  const text = body.text?.trim() ?? "";
  const title = (body.title?.trim() || "Pasted transcript").slice(0, 120);
  if (text.length < 40) {
    return NextResponse.json(
      { error: "Paste a longer transcript so there is enough material to train on." },
      { status: 400 }
    );
  }
  const cues = parseCaptions(text, "captions.txt");
  const id = randomUUID();
  await mkdir(videoDir(id), { recursive: true });
  await writeFile(path.join(videoDir(id), "captions.srt"), toSrt(cues), "utf8");
  const video: VideoRecord = {
    id,
    filename: "captions.srt",
    title,
    createdAt: new Date().toISOString(),
    durationSec: cues[cues.length - 1]?.endSec ?? null,
    sizeBytes: Buffer.byteLength(text),
    hasAudio: false,
    hasVideo: false,
    captionSource: "pasted",
    status: "transcribed",
    cues,
    thumbnailCount: 0,
    kind: "transcript",
  };
  await upsertVideo(video);
  return NextResponse.json({ video });
}
