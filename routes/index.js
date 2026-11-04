const express = require('express');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const { createJob, getJob, getAllJobs } = require('../services/job.service');
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

router.get('/logs', (req, res) => {
  const logger = require('../utils/logger');
  
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const send = (log) => {
    res.write(`data: ${JSON.stringify(log)}\n\n`);
  };

  logger.addLogListener(send);

  req.on('close', () => {
    logger.removeLogListener(send);
  });
});

module.exports = router;
