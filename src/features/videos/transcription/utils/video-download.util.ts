import { spawn } from 'child_process'
import { join } from 'path'
import { extractYoutubeVideoId } from './youtube-url.util'

export function downloadAudio(
  youtubeUrl: string,
  outputDir: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const videoId = extractYoutubeVideoId(youtubeUrl)
    if (!videoId) {
      reject(new Error(`Could not extract video ID from URL: ${youtubeUrl}`))
      return
    }

    const outputPath = join(outputDir, `${videoId}.mp3`)

    const proc = spawn('yt-dlp', [
      '--extract-audio',
      '--audio-format',
      'mp3',
      '--audio-quality',
      '0',
      '-o',
      outputPath,
      youtubeUrl,
    ])

    let stderr = ''
    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString()
    })

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(outputPath)
      } else {
        reject(
          new Error(
            `yt-dlp exited with code ${code}. Is yt-dlp installed? ${stderr}`,
          ),
        )
      }
    })

    proc.on('error', (err) => {
      reject(
        new Error(`Failed to spawn yt-dlp. Is it installed? ${err.message}`),
      )
    })
  })
}
