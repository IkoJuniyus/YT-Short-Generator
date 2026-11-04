const path = require('path');
require('dotenv').config();

const ROOT_DIR = path.join(__dirname, '..');

function resolveFolder(envValue, fallback) {
  const value = envValue || fallback;
  return path.isAbsolute(value) ? value : path.join(ROOT_DIR, value);
}

const config = {
  rootDir: ROOT_DIR,
  server: {
    port: parseInt(process.env.PORT, 10) || 3000,
    env: process.env.NODE_ENV || 'development',
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  },
  folders: {
    temp: resolveFolder(process.env.TEMP_FOLDER, 'temp'),
    output: resolveFolder(process.env.OUTPUT_FOLDER, 'output'),
    downloads: resolveFolder(process.env.DOWNLOAD_FOLDER, 'downloads'),
    logs: resolveFolder(process.env.LOG_FOLDER, 'logs'),
  },
  binaries: {
    ytdlp: process.env.YTDLP_PATH || 'yt-dlp',
    ffmpeg: process.env.FFMPEG_PATH || null,
    ffprobe: process.env.FFPROBE_PATH || null,
  },
  job: {
    maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS, 10) || 2,
    maxShortDuration: parseInt(process.env.MAX_SHORT_DURATION, 10) || 59,
    minShortDuration: parseInt(process.env.MIN_SHORT_DURATION, 10) || 15,
    fileTtlMinutes: parseInt(process.env.FILE_TTL_MINUTES, 10) || 60,
  },
  youtube: {
    enabled: process.env.YOUTUBE_ENABLED === 'true',
    privacy: process.env.YOUTUBE_PRIVACY || 'private',
  },
};

module.exports = config;
