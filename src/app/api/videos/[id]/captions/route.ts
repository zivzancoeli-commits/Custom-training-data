import { writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getVideo, upsertVideo } from "@/lib/store";
import { videoDir } from "@/lib/paths";
import { parseCaptions } from "@/lib/captions";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const video = await getVideo(id);
  if (!video) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Attach an SRT, VTT, or TXT file." }, { status: 400 });
  }
  const name = file.name.toLowerCase();
  if (!name.endsWith(".srt") && !name.endsWith(".vtt") && !name.endsWith(".txt")) {
    return NextResponse.json({ error: "Captions must be .srt, .vtt, or .txt." }, { status: 400 });
  }

  const raw = await file.text();
  const cues = parseCaptions(raw, file.name);
  if (cues.length === 0) {
    return NextResponse.json({ error: "Could not parse any caption cues." }, { status: 400 });
  }

  const ext = path.extname(file.name).toLowerCase() || ".srt";
  await writeFile(path.join(videoDir(id), `captions${ext}`), raw, "utf8");
  video.cues = cues;
  video.captionSource = "sidecar";
  video.status = "transcribed";
  video.error = undefined;
  await upsertVideo(video);
  return NextResponse.json({ video });
}
