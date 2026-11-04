const express = require('express');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const { createJob, getJob, getAllJobs } = require('../services/job.service');
const { addToQueue, getQueue, clearQueue } = require('../services/youtubeQueue.service');
const youtubeAuthRouter = require('./youtubeAuth');

const router = express.Router();

router.use('/youtube', youtubeAuthRouter);

router.post('/generate', (req, res) => {
  const { url } = req.body;
  if (!url || !url.includes('youtu')) {
    return res.status(400).json({ success: false, error: 'URL YouTube tidak valid' });
  }
  const job = createJob(url);
  res.status(202).json({
    success: true,
    data: { jobId: job.id, statusUrl: `/api/status/${job.id}` },
  });
});

router.get('/status/:id', (req, res) => {
  const job = getJob(req.params.id);
  if (!job) return res.status(404).json({ success: false, error: 'Job tidak ditemukan' });

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const send = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  send({
    id: job.id,
    status: job.status,
    stage: job.stage,
    progress: job.progress,
    videoInfo: job.videoInfo,
    segments: job.segments,
    shorts: job.shorts,
    error: job.error,
  });

  if (job.status === 'done' || job.status === 'error') {
    res.end();
    return;
  }

  job.listeners.push(send);

  const onDone = (data) => {
    if (data.status === 'done' || data.status === 'error') {
      setTimeout(() => res.end(), 500);
    }
  };
  job.listeners.push(onDone);

  req.on('close', () => {
    job.listeners = job.listeners.filter(l => l !== send && l !== onDone);
  });
});

router.get('/jobs', (req, res) => {
  const all = getAllJobs().map(j => ({
    id: j.id,
    status: j.status,
    stage: j.stage,
    progress: j.progress,
    videoInfo: j.videoInfo,
    shortsCount: j.shorts.length,
    createdAt: j.createdAt,
  }));
  res.json({ success: true, data: all });
});

router.get('/download/:jobId/:file', (req, res) => {
  const job = getJob(req.params.jobId);
  if (!job) return res.status(404).json({ success: false, error: 'Job tidak ditemukan' });

  const short = job.shorts.find(s => s.file === req.params.file);
  if (!short) return res.status(404).json({ success: false, error: 'File tidak ditemukan' });

  if (!fs.existsSync(short.path)) {
    return res.status(404).json({ success: false, error: 'File sudah dihapus' });
  }

  const safeName = `${(job.videoInfo?.title || 'short').replace(/[^a-zA-Z0-9_\-\s]/g, '').substring(0, 50)}_${short.file}`;
  res.download(short.path, safeName);
});

router.post('/reupload', async (req, res) => {
  const { shortId } = req.body;
  if (!shortId) return res.status(400).json({ success: false, error: 'shortId required' });

  const queue = getQueue();
  const item = queue.find(q => q.id === shortId);
  if (!item) return res.status(404).json({ success: false, error: 'Item not found' });

  const { generateViralCaption } = require('../services/captionGenerator.service');
  const { uploadVideo } = require('../services/youtube.service');

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
    item.retryCount = 0;
    fs.writeFileSync(path.join(config.folders.temp, 'youtube_upload_queue.json'), JSON.stringify(queue, null, 2));
    res.json({ success: true, message: 'Re-upload successful' });
  } else {
    res.json({ success: false, error: result.error });
  }
});

router.get('/queue', (req, res) => {
  res.json({ success: true, data: getQueue() });
});

router.delete('/queue', (req, res) => {
  clearQueue();
  res.json({ success: true, message: 'Queue cleared' });
});

module.exports = router;
