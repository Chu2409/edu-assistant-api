---
name: Available Dependencies
description: npm packages already in package.json needed for transcription services
type: project
---

## Transcription Dependencies (Already Installed)

From `package.json`:
- **youtube-transcript** v1.3.0 — Extract captions from YouTube videos
  - API: `YoutubeTranscript.fetchTranscript(videoId)` → returns array of `{offset, duration, text}`
  
- **nodejs-whisper** v0.3.0 — OpenAI Whisper for audio transcription
  - API: `nodeWhisper(audioFilePath, options)` → Promise
  - Requires WHISPER_MODEL env var (in IConfig.WHISPER_MODEL)
  
- **yt-dlp** — NOT in package.json; needs to be installed system-wide OR as npm package
  - If using as npm package: `npm install yt-dlp`
  - Command-line: `yt-dlp --extract-audio --audio-format mp3 --audio-quality 0 [url]`
  - Returns file at: `~/Downloads/[video-title].mp3` (configurable with output dir)

## Prisma Enums

**SourceKind** (from schema, NOT yet in generated enums.ts):
- `YOUTUBE_URL` — input is YouTube URL
- `VIDEO_FILE` — input is local file path

Will be available after next Prisma generate/migrate.

## Config Values Available

From `src/core/config/types/index.ts`:
- `WHISPER_MODEL: string` — Model name (e.g., "base", "small", "medium")
- `WHISPER_LANGUAGE: string` — Default language for transcription
