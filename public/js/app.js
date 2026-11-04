let currentEventSource = null;
let logEventSource = null;

function startGenerate() {
  const url = document.getElementById('urlInput').value.trim();
  if (!url) return;

  const btn = document.getElementById('generateBtn');
  btn.disabled = true;
  btn.textContent = 'Processing...';

  hide('results-section');
  hide('error-section');
  show('status-section');
  showLogSection();
  document.getElementById('videoInfo').innerHTML = '';
  document.getElementById('progressBar').style.width = '0%';
  document.getElementById('stageText').textContent = 'Memulai...';
  document.getElementById('progressPct').textContent = '0%';
  document.getElementById('shortsList').innerHTML = '';

  if (currentEventSource) {
    currentEventSource.close();
  }

  fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
    .then(r => r.json())
    .then(data => {
      if (!data.success) {
        showError(data.error || 'Gagal memulai');
        btn.disabled = false;
        btn.textContent = 'Generate Shorts';
        return;
      }
      listenStatus(data.data.jobId);
    })
    .catch(err => {
      showError(err.message);
      btn.disabled = false;
      btn.textContent = 'Generate Shorts';
    });
}

function listenStatus(jobId) {
  const es = new EventSource(`/api/status/${jobId}`);
  currentEventSource = es;

  es.onmessage = (e) => {
    const data = JSON.parse(e.data);
    updateUI(data);

    if (data.status === 'done' || data.status === 'error') {
      es.close();
      const btn = document.getElementById('generateBtn');
      btn.disabled = false;
      btn.textContent = 'Generate Shorts';
    }
  };

  es.onerror = () => {
    es.close();
    const btn = document.getElementById('generateBtn');
    btn.disabled = false;
    btn.textContent = 'Generate Shorts';
  };
}

function updateUI(data) {
  document.getElementById('progressBar').style.width = data.progress + '%';
  document.getElementById('stageText').textContent = data.stage;
  document.getElementById('progressPct').textContent = data.progress + '%';

  if (data.videoInfo) {
    const vi = data.videoInfo;
    document.getElementById('videoInfo').innerHTML = `
      <img src="${vi.thumbnail}" alt="thumb" onerror="this.style.display='none'">
      <div class="info-text">
        <h3>${escHtml(vi.title)}</h3>
        <p>${escHtml(vi.channel || '')} &bull; ${formatDur(vi.duration)}</p>
      </div>
    `;
  }

  if (data.status === 'done' && data.shorts && data.shorts.length > 0) {
    show('results-section');
    const list = document.getElementById('shortsList');
    list.innerHTML = data.shorts.map(s => {
      const youtubeStatus = s.youtube?.status || 'not_attempted';
      let actionHtml = `<a class="download-btn" href="/api/download/${data.id}/${s.file}">Download</a>`;
      
      if (youtubeStatus === 'error') {
        actionHtml = `<button class="reupload-btn" onclick="reupload('${data.id}', '${s.index}')">🔄 Re-upload</button>`;
      } else if (youtubeStatus === 'uploaded') {
        actionHtml = `<span class="upload-status">✅ Uploaded to YouTube</span>`;
      } else if (youtubeStatus === 'error') {
        actionHtml = `<span class="upload-status">❌ Upload failed: ${escHtml(s.youtube?.error || '')}</span><br><button class="reupload-btn" onclick="reupload('${data.id}', '${s.index}')">🔄 Re-upload</button>`;
      }
      
      return `
      <div class="short-card">
        <div class="short-header">
          <h3>Short #${s.index}</h3>
          ${youtubeStatus === 'uploaded' ? '<span style="color:#4CAF50">✅</span>' : youtubeStatus === 'error' ? '<span style="color:#f44336">❌</span>' : ''}
        </div>
        <div class="short-time">${formatDur(s.segment.start)} - ${formatDur(s.segment.end)} (${s.segment.duration}s)</div>
        <div class="short-preview">${escHtml(s.segment.preview || '')}</div>
        <div class="action-buttons">${actionHtml}</div>
      </div>
    `;
    }).join('');
  }

  if (data.status === 'error') {
    showError(data.error);
  }
}

function showLogSection() {
  const logDiv = document.getElementById('logSection');
  if (logDiv && logDiv.classList.contains('hidden')) {
    logDiv.classList.remove('hidden');
    if (logEventSource) logEventSource.close();
    logEventSource = new EventSource('/api/logs');
    logEventSource.onmessage = (e) => {
      const log = JSON.parse(e.data);
      const entry = document.createElement('div');
      entry.className = `log-entry log-${log.level}`;
      const time = new Date(log.timestamp).toLocaleTimeString();
      entry.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-level">${log.level.toUpperCase()}</span> <span class="log-message">${escHtml(log.message)}</span>`;
      document.getElementById('logs').appendChild(entry);
      document.getElementById('logs').scrollTop = document.getElementById('logs').scrollHeight;
    };
    logEventSource.onerror = () => {
      logEventSource.close();
    };
  }
}

function formatDur(sec) {
  if (!sec) return '0:00';
  sec = Math.floor(sec);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m + ':' + String(s).padStart(2, '0');
}

function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function showError(msg) {
  show('error-section');
  document.getElementById('errorText').textContent = msg;
}

function show(id) { document.getElementById(id).classList.remove('hidden'); }
function hide(id) { document.getElementById(id).classList.add('hidden'); }

document.getElementById('urlInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') startGenerate();
});
