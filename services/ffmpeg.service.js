const ffmpeg = require('fluent-ffmpeg');
const ffmpegStaticPath = require('ffmpeg-static');
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');
const { ensureDir } = require('../utils/fileHelper');

const FFMPEG_PATH = config.binaries.ffmpeg || ffmpegStaticPath;
if (FFMPEG_PATH) ffmpeg.setFfmpegPath(FFMPEG_PATH);

try {
  const ffprobeStaticPath = require('ffprobe-static').path;
  const FFPROBE_PATH = config.binaries.ffprobe || ffprobeStaticPath;
  if (FFPROBE_PATH) ffmpeg.setFfprobePath(FFPROBE_PATH);
} catch {}

function getVideoMeta(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      const video = metadata.streams.find(s => s.codec_type === 'video');
      resolve({
        width: video ? video.width : 1920,
        height: video ? video.height : 1080,
        duration: metadata.format.duration,
      });
    });
  });
}

function generateShort(inputPath, outputPath, segment, videoMeta, onProgress) {
  return new Promise((resolve, reject) => {
    ensureDir(path.dirname(outputPath));

    const srcW = videoMeta.width;
    const srcH = videoMeta.height;

    const targetRatio = 9 / 16;
    let cropW, cropH;

    if (srcW / srcH > targetRatio) {
      cropH = srcH;
      cropW = Math.floor(srcH * targetRatio);
    } else {
      cropW = srcW;
      cropH = Math.floor(srcW / targetRatio);
    }

    cropW = cropW - (cropW % 2);
    cropH = cropH - (cropH % 2);

    const cropX = Math.floor((srcW - cropW) / 2);
    const cropY = Math.floor((srcH - cropH) / 2);

    const duration = segment.end - segment.start;

    const cmd = ffmpeg(inputPath)
      .setStartTime(segment.start)
      .setDuration(duration)
      .videoFilters([
        `crop=${cropW}:${cropH}:${cropX}:${cropY}`,
        `scale=1080:1920:force_original_aspect_ratio=decrease`,
        `pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black`,
      ])
      .outputOptions([
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        '-pix_fmt', 'yuv420p',
      ])
      .output(outputPath);

    cmd.on('progress', (p) => {
      if (onProgress && p.percent) {
        onProgress(Math.min(100, Math.round(p.percent)));
      }
    });

    cmd.on('end', () => resolve(outputPath));
    cmd.on('error', (err) => reject(err));
    cmd.run();
  });
}

module.exports = { getVideoMeta, generateShort };
