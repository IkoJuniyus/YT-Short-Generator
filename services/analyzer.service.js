const config = require('../config');
const logger = require('../utils/logger');

function analyzeTranscript(subtitleSegments, videoDuration) {
  const maxDur = config.job.maxShortDuration;
  const minDur = config.job.minShortDuration;

  if (!subtitleSegments || subtitleSegments.length === 0) {
    return generateEvenSegments(videoDuration, maxDur, minDur);
  }

  const scored = scoreSegments(subtitleSegments);
  const clusters = clusterHighScoreSegments(scored, maxDur, minDur);

  if (clusters.length === 0) {
    return generateEvenSegments(videoDuration, maxDur, minDur);
  }

  return clusters.map((c, i) => ({
    index: i + 1,
    start: Math.max(0, Math.floor(c.start)),
    end: Math.min(Math.ceil(c.end), Math.floor(videoDuration)),
    duration: Math.ceil(c.end) - Math.floor(c.start),
    score: c.score,
    preview: c.text.substring(0, 100),
  }));
}

function scoreSegments(segments) {
  const hookWords = [
    'tapi', 'ternyata', 'rahasia', 'sebenarnya', 'gila', 'wow', 'fakta',
    'penting', 'harus', 'jangan', 'bahaya', 'kunci', 'trick', 'tips',
    'but', 'actually', 'secret', 'never', 'always', 'must', 'why',
    'how', 'shocking', 'amazing', 'incredible', 'important', 'mistake',
    'problem', 'solution', 'hack', 'truth', 'reason', 'story',
    'pertama', 'kedua', 'ketiga', 'langkah', 'cara',
    '?', '!', '...', 'guys', 'bro',
  ];

  return segments.map((seg) => {
    let score = 1;
    const lower = seg.text.toLowerCase();

    for (const word of hookWords) {
      if (lower.includes(word)) score += 2;
    }

    if (seg.text.includes('?')) score += 3;
    if (seg.text.includes('!')) score += 2;

    if (seg.text.length > 20) score += 1;
    if (seg.text.length > 50) score += 1;

    const words = seg.text.split(/\s+/).length;
    if (words >= 5 && words <= 30) score += 2;

    return { ...seg, score };
  });
}

function clusterHighScoreSegments(scored, maxDur, minDur) {
  const threshold = Math.max(
    5,
    scored.reduce((sum, s) => sum + s.score, 0) / scored.length
  );

  const hot = scored.filter(s => s.score >= threshold);
  if (hot.length === 0) return [];

  const clusters = [];
  let current = {
    start: hot[0].start,
    end: hot[0].end,
    text: hot[0].text,
    score: hot[0].score,
    count: 1,
  };

  for (let i = 1; i < hot.length; i++) {
    const seg = hot[i];
    const gap = seg.start - current.end;
    const projectedDur = seg.end - current.start;

    if (gap < 5 && projectedDur <= maxDur) {
      current.end = seg.end;
      current.text += ' ' + seg.text;
      current.score += seg.score;
      current.count++;
    } else {
      if (current.end - current.start >= minDur) {
        clusters.push({ ...current });
      }
      current = {
        start: seg.start,
        end: seg.end,
        text: seg.text,
        score: seg.score,
        count: 1,
      };
    }
  }

  if (current.end - current.start >= minDur) {
    clusters.push(current);
  }

  for (const c of clusters) {
    const dur = c.end - c.start;
    if (dur < minDur) {
      const pad = (minDur - dur) / 2;
      c.start = Math.max(0, c.start - pad);
      c.end = c.end + pad;
    }
    if (c.end - c.start > maxDur) {
      c.end = c.start + maxDur;
    }
  }

  clusters.sort((a, b) => b.score - a.score);

  return clusters.slice(0, 10);
}

function generateEvenSegments(duration, maxDur, minDur) {
  const segDur = Math.min(maxDur, Math.max(minDur, 45));
  const count = Math.min(10, Math.floor(duration / segDur));
  const segments = [];

  for (let i = 0; i < count; i++) {
    const start = i * segDur;
    const end = Math.min(start + segDur, duration);
    if (end - start < minDur) break;
    segments.push({
      index: i + 1,
      start: Math.floor(start),
      end: Math.floor(end),
      duration: Math.floor(end - start),
      score: 0,
      preview: `Segment ${i + 1}`,
    });
  }

  return segments;
}

module.exports = { analyzeTranscript };
