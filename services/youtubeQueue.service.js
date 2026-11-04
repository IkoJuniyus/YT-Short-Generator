const fs = require('fs');
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');
const { uploadVideo } = require('./youtube.service');
const { generateViralCaption } = require('./captionGenerator.service');
const { ensureDir } = require('../utils/fileHelper');

const QUEUE_FILE = path.join(config.folders.temp, 'youtube_upload_queue.json');
ensureDir(config.folders.temp);

let queue = [];

function loadQueue() {
  try {
    if (fs.existsSync(QUEUE_FILE)) {
      queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'));
      logger.info(`Loaded ${queue.length} queued uploads`);
      return queue;
    }
  } catch (err) {
    logger.error('Failed to load queue:', err.message);
  }
  queue = [];
  return queue;
}

function saveQueue() {
  try {
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
  } catch (err) {
    logger.error('Failed to save queue:', err.message);
  }
}

function addToQueue(short, videoInfo, job) {
  queue.push({
    id: short.id || `${job.id}_${short.index}_${Date.now()}`,
    jobId: job.id,
    jobTitle: job.videoInfo?.title || 'YouTube Short',
    channel: job.videoInfo?.channel || '',
    shortIndex: short.index,
    filePath: short.path,
    fileName: short.file,
    segment: short.segment,
    createdAt: Date.now(),
    retryCount: 0,
    status: 'pending',
    lastError: null,
  });
  saveQueue();
  logger.info(`Queued upload for short #${short.index}: ${short.file}`);
  return queue[queue.length - 1];
}

async function processQueue() {
  if (!config.youtube?.enabled) {
    logger.info('YouTube upload disabled, skipping queue');
    return;
  }

  const queued = loadQueue().filter(q => q.status === 'pending');
  if (queued.length === 0) {
    logger.info('No uploads in queue');
    return;
  }

  logger.info(`Processing ${queued.length} queued upload(s)...`);

  for (const item of queued) {
    try {
      const caption = generateViralCaption(
        item.segment.preview,
        item.jobTitle,
        item.channel
      );

      const result = await uploadVideo(item.filePath, caption.title, caption.description, caption.hashtags, {
        privacy: config.youtube?.privacy || 'private',
      });

      if (result.success) {
        item.status = 'success';
        item.youtubeVideoId = result.videoId;
        item.uploadedAt = new Date().toISOString();
        logger.info(`Successfully uploaded short #${item.shortIndex} to YouTube: ${result.videoId}`);
      } else {
        item.status = 'error';
        item.lastError = result.error;
        item.retryCount++;
        logger.warn(`Upload short #${item.shortIndex} failed: ${result.error}`);
      }
    } catch (err) {
      item.status = 'error';
      item.lastError = err.message;
      item.retryCount++;
      logger.error(`Upload error for short #${item.shortIndex}:`, err.message);
    }
    saveQueue();
  }

  const remaining = queue.filter(q => q.status === 'pending');
  if (remaining.length > 0) {
    logger.info(`Queue remaining: ${remaining.length} uploads`);
  }
}

function getQueue() {
  return loadQueue();
}

function clearQueue() {
  queue = [];
  if (fs.existsSync(QUEUE_FILE)) {
    fs.unlinkSync(QUEUE_FILE);
  }
  logger.info('Upload queue cleared');
}

module.exports = { loadQueue, addToQueue, processQueue, getQueue, clearQueue };
