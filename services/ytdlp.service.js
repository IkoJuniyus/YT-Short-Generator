const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const logger = require('../utils/logger');
const { ensureDir } = require('../utils/fileHelper');

ensureDir(config.folders.downloads);
ensureDir(config.folders.temp);

function runYtdlp(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(config.binaries.ytdlp, args, { windowsHide: true });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('close', (code) => {
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(stderr || `yt-dlp exited with code ${code}`));
    });
    proc.on('error', reject);
  });
}

async function getVideoInfo(url) {
  const raw = await runYtdlp([
    '--dump-json', '--no-download', '--no-playlist', url,
  ]);
  const info = JSON.parse(raw);
  return {
    id: info.id,
    title: info.title,
    thumbnail: info.thumbnail,
    duration: info.duration,
    channel: info.channel || info.uploader,
    description: info.description || '',
  };
}

async function downloadVideo(url, videoId, onProgress) {
  const outputTemplate = path.join(config.folders.downloads, `${videoId}.%(ext)s`);

  const existingFiles = fs.readdirSync(config.folders.downloads).filter(f => f.startsWith(videoId + '.'));
  if (existingFiles.length > 0) {
    const cached = path.join(config.folders.downloads, existingFiles[0]);
    logger.info('Video sudah ada di cache:', cached);
    if (onProgress) onProgress(100);
    return cached;
  }

  return new Promise((resolve, reject) => {
    const ffmpegPath = config.binaries.ffmpeg || require('ffmpeg-static');
    const args = [
      '-f', 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best',
      '--merge-output-format', 'mp4',
      '--ffmpeg-location', path.dirname(ffmpegPath),
      '--no-playlist',
      '--newline',
      '-o', outputTemplate,
      url,
    ];
    const proc = spawn(config.binaries.ytdlp, args, { windowsHide: true });
    let stderr = '';

    proc.stdout.on('data', (data) => {
      const line = data.toString();
      const match = line.match(/(\d+\.?\d*)%/);
      if (match && onProgress) {
        onProgress(parseFloat(match[1]));
      }
    });

    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    proc.on('close', (code) => {
      if (code !== 0) return reject(new Error(stderr || 'yt-dlp download failed'));
      const files = fs.readdirSync(config.folders.downloads).filter(f => f.startsWith(videoId + '.'));
      if (files.length === 0) return reject(new Error('Downloaded file not found'));
      resolve(path.join(config.folders.downloads, files[0]));
    });

    proc.on('error', reject);
  });
}

async function extractSubtitles(url, videoId) {
  const subPath = path.join(config.folders.temp, videoId);

  try {
    await runYtdlp([
      '--write-auto-sub', '--sub-lang', 'id,en',
      '--sub-format', 'json3',
      '--skip-download',
      '--no-playlist',
      '-o', subPath,
      url,
    ]);
  } catch (e) {
    logger.warn('Subtitle auto tidak tersedia, coba manual sub...');
    try {
      await runYtdlp([
        '--write-sub', '--sub-lang', 'id,en',
        '--sub-format', 'json3',
        '--skip-download',
        '--no-playlist',
        '-o', subPath,
        url,
      ]);
    } catch {
      logger.warn('Tidak ada subtitle tersedia');
      return null;
    }
  }

  const tempDir = config.folders.temp;
  const subFiles = fs.readdirSync(tempDir).filter(f => f.startsWith(videoId) && f.endsWith('.json3'));
  if (subFiles.length === 0) return null;

  const subFile = path.join(tempDir, subFiles[0]);
  const raw = JSON.parse(fs.readFileSync(subFile, 'utf-8'));

  const segments = [];
  if (raw.events) {
    for (const event of raw.events) {
      if (!event.segs) continue;
      const text = event.segs.map(s => s.utf8 || '').join('').trim();
      if (!text || text === '\n') continue;
      segments.push({
        start: (event.tStartMs || 0) / 1000,
        end: ((event.tStartMs || 0) + (event.dDurationMs || 2000)) / 1000,
        text,
      });
    }
  }

  return segments;
}

module.exports = { getVideoInfo, downloadVideo, extractSubtitles };
