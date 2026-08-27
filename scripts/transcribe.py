#!/usr/bin/env python3
"""Transcribe a 16 kHz mono WAV with faster-whisper and write JSON cues."""

from __future__ import annotations

import json
import sys
from pathlib import Path


def main() -> int:
    if len(sys.argv) < 3:
        print("usage: transcribe.py AUDIO.wav OUT.json [model]", file=sys.stderr)
        return 2

    audio = sys.argv[1]
    out = Path(sys.argv[2])
    model_name = sys.argv[3] if len(sys.argv) > 3 else "tiny.en"

    try:
        from faster_whisper import WhisperModel
    except ImportError:
        out.write_text(
            json.dumps(
                {
                    "error": "faster-whisper is not installed. pip install faster-whisper"
                }
            )
        )
        return 0

    model = WhisperModel(model_name, device="cpu", compute_type="int8")
    segments, info = model.transcribe(
        audio,
        vad_filter=True,
    beam_size=5,
    language="en" if model_name.endswith(".en") else None,
    condition_on_previous_text=True,
    vad_parameters={"min_silence_duration_ms": 400},
    )

    cues = []
    for segment in segments:
        text = (segment.text or "").strip()
        if not text:
            continue
        cues.append(
            {
                "startSec": round(float(segment.start or 0), 2),
                "endSec": round(float(segment.end or 0), 2),
                "text": text,
            }
        )

    out.write_text(
        json.dumps(
            {
                "language": getattr(info, "language", None),
                "cues": cues,
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
