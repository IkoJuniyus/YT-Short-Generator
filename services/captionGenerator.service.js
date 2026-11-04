const config = require('../config');

function generateViralCaption(segmentText, title, channel, niche = 'general') {
  const hooks = [
    'Jangan lewatkan momen ini!',
    'Ini bakal bikin kamu terkesima!',
    'Rahasia yang selama ini disembunyikan...',
    'Kamu pasti belum tahu yang satu ini!',
    'Wajib tonton sebelum tidur!',
    'Ini bisa mengubah hidupmu!',
    'Siapa sangka...',
    'Gak nyangka kan?',
    'Fakta mengejutkan!',
    'Ini yang kamu cari selama ini!',
    'Baca sampai habis, jangan skip!',
    'Dijamin bikin kamu penasaran!',
    'Kamu harus lihat ini!',
    'Worth the wait!',
    'Ini yang lagi trending!',
  ];

  const CTAs = [
    'Follow for more!',
    'Subscribe dan aktifkan lonceng🔔',
    'Like kalau setuju!',
    'Comment apa pendapatmu?',
    'Share ke temanmu!',
    'Jangan lupa Subscribe Ya!',
    'Bantu channel ini grow!',
    'Komen "SETUJU" kalau setuju!',
    'Rate 5 star kalau suka!',
    'Dukung channel ini dengan like!',
  ];

  const hashtags = {
    general: ['#viral', '#fyp', '#trending', '#viralvideo', '#foryou'],
    entertainment: ['#viral', '#trending', '#entertainment', '#reels', '#shorts'],
    education: ['#edutok', '#learnontiktok', '#education', '#knowledge', '#facts'],
    lifestyle: ['#lifestyle', '#viral', '#trending', '#daily', '#inspiration'],
    tech: ['#tech', '#gadget', '#techreview', '#techtok', '#techtips'],
    gaming: ['#gaming', '#gamer', '#gameclips', '#gamingcommunity', '#shorts'],
    news: ['#breaking', '#news', '#updates', '#trendingnews', '#viral'],
    motivational: ['#motivation', '#success', '#mindset', '#growth', '#inspiration'],
  };

  const selectedHook = hooks[Math.floor(Math.random() * hooks.length)];
  const selectedCTA = CTAs[Math.floor(Math.random() * CTAs.length)];
  const selectedTags = hashtags[niche] || hashtags.general;

  const baseCaption = `${selectedHook}\n\n"${segmentText.substring(0, 100)}..."`;

  const hashtagsStr = selectedTags.slice(0, 5).join(' ');

  const caption = `${baseCaption}\n\n${selectedCTA}\n\n${hashtagsStr}`;

  const shortTitle = title
    .replace(/[^\w\s]/gi, '')
    .substring(0, 80)
    .trim() + ' #' + niche;

  return {
    title: shortTitle,
    description: caption,
    hashtags: selectedTags,
  };
}

module.exports = { generateViralCaption };
