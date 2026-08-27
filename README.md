# Reelset

Turn lectures, talks, and screen recordings into a fine-tuning dataset.

Drop a video (or paste a transcript). Reelset transcribes it, writes instruction examples grounded in what was actually said, and exports JSONL you can feed to OpenAI, Llama-Factory, Axolotl, or similar trainers.

## What you get

Reelset writes instruction examples from the transcript — not raw dumps of the footage. It stitches caption/Whisper fragments into complete sentences, then mines definitions, steps, recommendations, contrasts, and “use X when Y” advice. Answers are complete sentences grounded in the clip, with an approximate timestamp. Weak prompts (word salad, timestamp trivia, noun-bag questions) are dropped. Out-of-scope questions get honest refusals so a fine-tune does not learn to hallucinate.

Each source becomes a mix of:

- Closed-book Q&A (the model is treated as if it watched the video)
- Open-book Q&A (a tight excerpt around the claim is included in the prompt)
- Summaries and takeaways
- How-to / enumerated steps when the speaker lists stages
- Refusal examples so the model learns to say “this video didn’t cover that”
- Optional multi-turn follow-ups

Export formats:

- **OpenAI JSONL** — `messages` chat format
- **Alpaca JSON** — `instruction` / `input` / `output`
- **ShareGPT JSON** — `conversations`
- **ChatML JSONL** — single `text` field
- **Reelset JSON** — full records with timestamps and source quotes

## Run locally

You need Node 20+, ffmpeg, and (for speech-to-text) Python 3 with `faster-whisper`.

```bash
npm install
pip install -r requirements.txt
npm run build
npm start
```

Open [http://127.0.0.1:43147](http://127.0.0.1:43147). During development you can use `npm run dev` instead.

If Whisper isn’t installed, attach an `.srt` / `.vtt` or paste the transcript. Captions are preferred when present.

```bash
npm test
npm run build
```

## How transcription is chosen

1. Sidecar captions you drop or attach (`captions.srt` / `.vtt` / `.txt`)
2. A transcript you paste
3. Embedded subtitle tracks in the file
4. Whisper (`tiny.en` by default, CPU via faster-whisper)

Videos are stored under `data/` on disk. Nothing is uploaded to a third-party API.

## Fine-tuning after export

Use the OpenAI JSONL with a chat-completions fine-tune, or convert Alpaca/ShareGPT in your trainer of choice. Keep the system prompt — it tells the model to answer from the video and to refuse when the footage doesn’t cover the question.

For a first pass, start with the **balanced** density on a couple of talks, drop any sloppy pairs in the studio, then export.
