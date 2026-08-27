import { randomUUID } from "node:crypto";
import { mkdir, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { ALLOWED_VIDEO_EXT, videoDir } from "@/lib/paths";
import { probeMedia, extractThumbnails } from "@/lib/ffmpeg";
import { readIndex, upsertVideo } from "@/lib/store";
import type { VideoRecord } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function titleFromFilename(name: string) {
  const base = name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  return base.length > 0 ? base : "Untitled clip";
}

export async function GET() {
  const { videos } = await readIndex();
  return NextResponse.json({ videos });
}

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose a video file." }, { status: 400 });
  }

  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_VIDEO_EXT.has(ext)) {
    return NextResponse.json(
      { error: "Use MP4, MOV, WEBM, MKV, M4V, or AVI." },
      { status: 400 }
    );
  }
  if (file.size > 512 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Videos over 512 MB need to be compressed first." },
      { status: 413 }
    );
  }

  const id = randomUUID();
  const filename = `source${ext}`;
  const dir = videoDir(id);
  await mkdir(dir, { recursive: true });
  const dest = path.join(dir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(dest, buffer);

  let probe = {
    durationSec: null as number | null,
    hasAudio: false,
    hasVideo: true,
    hasSubtitles: false,
  };
  try {
    probe = await probeMedia(dest);
  } catch {
    // keep defaults
  }

  let thumbs = 0;
  if (probe.hasVideo) {
    try {
      thumbs = await extractThumbnails(dest, dir, probe.durationSec, 5);
    } catch {
      thumbs = 0;
    }
  }

  const video: VideoRecord = {
    id,
    filename,
    title: titleFromFilename(file.name),
    createdAt: new Date().toISOString(),
    durationSec: probe.durationSec,
    sizeBytes: (await stat(dest)).size,
    hasAudio: probe.hasAudio,
    hasVideo: probe.hasVideo,
    captionSource: "none",
    status: "ready",
    cues: [],
    thumbnailCount: thumbs,
    kind: "video",
  };
  await upsertVideo(video);
  return NextResponse.json({ video });
}
