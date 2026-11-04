const { v4: uuidv4 } = require('uuid');
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');
const { getVideoInfo, downloadVideo, extractSubtitles } = require('./ytdlp.service');
const { analyzeTranscript } = require('./analyzer.service');
const { getVideoMeta, generateShort } = require('./ffmpeg.service');
const { ensureDir } = require('../utils/fileHelper');

const jobs = new Map();

function getJob(jobId) {
  return jobs.get(jobId);
}

function getAllJobs() {
  return Array.from(jobs.values()).sort((a, b) => b.createdAt - a.createdAt);
}

function createJob(url) {
  const jobId = uuidv4();
  const job = {
    id: jobId,
    url,
    status: 'queued',
    stage: 'Menunggu...',
    progress: 0,
    videoInfo: null,
    segments: [],
    shorts: [],
    error: null,
    createdAt: Date.now(),
    listeners: [],
  };
  jobs.set(jobId, job);
  processJob(job);
  return job;
}

function emitUpdate(job) {
  const data = {
    id: job.id,
    status: job.status,
    stage: job.stage,
    progress: job.progress,
    videoInfo: job.videoInfo,
    segments: job.segments,
    shorts: job.shorts,
    error: job.error,
  };
  for (const listener of job.listeners) {
    try { listener(data); } catch {}
  }
}

async function processJob(job) {
  try {
    job.status = 'processing';
    job.stage = 'Mengambil info video...';
    job.progress = 5;
    emitUpdate(job);

    const info = await getVideoInfo(job.url);
    job.videoInfo = info;
    logger.info('Video info:', info.title);
    emitUpdate(job);

    job.stage = 'Mengunduh video...';
    job.progress = 10;
    emitUpdate(job);

    const videoPath = await downloadVideo(job.url, info.id, (pct) => {
      job.progress = 10 + Math.round(pct * 0.3);
      job.stage = `Mengunduh video... ${Math.round(pct)}%`;
      emitUpdate(job);
    });

    job.stage = 'Mengekstrak subtitle...';
    job.progress = 42;
    emitUpdate(job);

    const subtitles = await extractSubtitles(job.url, info.id);
    logger.info('Subtitle segments:', subtitles ? subtitles.length : 0);

    job.stage = 'Menganalisis momen menarik...';
    job.progress = 48;
    emitUpdate(job);

    const segments = analyzeTranscript(subtitles, info.duration);
    job.segments = segments;
    logger.info(`Ditemukan ${segments.length} segment menarik`);
    emitUpdate(job);

    const meta = await getVideoMeta(videoPath);

    job.stage = 'Membuat shorts...';
    job.progress = 50;
    emitUpdate(job);

    const outputDir = path.join(config.folders.output, job.id);
    ensureDir(outputDir);

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const outputFile = path.join(outputDir, `short_${i + 1}.mp4`);
      const shortProgress = 50 + Math.round(((i) / segments.length) * 48);

      job.stage = `Membuat short ${i + 1}/${segments.length}...`;
      job.progress = shortProgress;
      emitUpdate(job);

      try {
        await generateShort(videoPath, outputFile, seg, meta, (pct) => {
          const segPortion = 48 / segments.length;
          job.progress = 50 + Math.round((i * segPortion) + (pct / 100 * segPortion));
          emitUpdate(job);
        });

        job.shorts.push({
          index: i + 1,
          file: `short_${i + 1}.mp4`,
          segment: seg,
          path: outputFile,
        });
      } catch (err) {
        logger.error(`Gagal membuat short ${i + 1}:`, err.message);
      }
    }

    job.status = 'done';
    job.stage = `Selesai! ${job.shorts.length} shorts berhasil dibuat.`;
    job.progress = 100;
    emitUpdate(job);
    logger.info(`Job ${job.id} selesai: ${job.shorts.length} shorts`);

  } catch (err) {
    job.status = 'error';
    job.stage = 'Gagal';
    job.error = err.message;
    emitUpdate(job);
    logger.error('Job gagal:', err.message);
  }
}

module.exports = { createJob, getJob, getAllJobs };
