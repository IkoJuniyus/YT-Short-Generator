// Dashboard Navigation
function showTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  // Show selected tab
  document.getElementById('tab-' + tabName).classList.add('active');
  
  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const activeBtn = Array.from(document.querySelectorAll('.nav-btn')).find(b => b.innerText.toLowerCase().includes(tabName));
  if (activeBtn) activeBtn.classList.add('active');

  // Load data based on tab
  if (tabName === 'queue') loadQueue();
  if (tabName === 'history') loadHistory();
  if (tabName === 'settings') loadSettings();
}

// Queue Management
async function loadQueue() {
  try {
    const res = await fetch('/api/queue');
    const data = await res.json();
    document.getElementById('queueCount').textContent = data.data.length;
    
    const list = document.getElementById('queueList');
    if (data.data.length === 0) {
      list.innerHTML = '<div class="empty-state">No queued uploads</div>';
      return;
    }
    
    list.innerHTML = data.data.map(item => `
      <div class="queue-item">
        <div class="queue-info">
          <div class="queue-title">${escHtml(item.jobTitle)}</div>
          <div class="queue-meta">Short #${item.shortIndex} • Retry: ${item.retryCount}</div>
        </div>
        <div class="queue-actions">
          ${item.status === 'pending' ? `
            <button class="btn btn-primary" onclick="manualUpload('${item.id}')">⚡ Upload Now</button>
          ` : ''}
          <button class="btn btn-danger" onclick="removeFromQueue('${item.id}')">🗑 Remove</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Load queue failed:', err);
  }
}

async function removeFromQueue(id) {
  if (!confirm('Remove this item from queue?')) return;
  
  try {
    const res = await fetch('/api/queue', { method: 'DELETE' });
    if (res.ok) {
      loadQueue();
      alert('Queue cleared');
    }
  } catch (err) {
    console.error('Remove failed:', err);
  }
}

async function manualUpload(id) {
  const btn = event.target;
  btn.disabled = true;
  btn.textContent = 'Uploading...';
  
  try {
    const res = await fetch('/api/reupload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shortId: id })
    });
    
    const data = await res.json();
    if (data.success) {
      alert('Upload successful!');
      loadQueue();
    } else {
      alert('Upload failed: ' + data.error);
      btn.disabled = false;
      btn.textContent = '⚡ Upload Now';
    }
  } catch (err) {
    alert('Error: ' + err.message);
    btn.disabled = false;
    btn.textContent = '⚡ Upload Now';
  }
}

// History Management
async function loadHistory() {
  try {
    const res = await fetch('/api/jobs');
    const data = await res.json();
    document.getElementById('historyCount').textContent = data.data.length + ' jobs';
    
    const list = document.getElementById('historyList');
    if (data.data.length === 0) {
      list.innerHTML = '<div class="empty-state">No jobs yet</div>';
      return;
    }
    
    list.innerHTML = data.data.map(job => `
      <div class="history-item">
        <div class="history-header">
          <span class="job-status status-${job.status}">${job.status.toUpperCase()}</span>
          <span class="job-id">${job.id.substring(0, 8)}...</span>
          <span class="job-time">${new Date(job.createdAt).toLocaleString()}</span>
        </div>
        <div class="history-body">
          <div class="history-meta">
            Shorts: ${job.shortsCount} • ${formatDur(job.videoInfo?.duration)} video
          </div>
          <div class="history-title">${escHtml(job.videoInfo?.title || 'N/A')}</div>
          ${job.error ? `<div class="history-error">Error: ${escHtml(job.error)}</div>` : ''}
          <button class="btn btn-sm" onclick="location.href='/#job-${job.id}'">View Details</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Load history failed:', err);
  }
}

// Settings
function loadSettings() {
  // Node version
  fetch('/api/health').then(r => r.json()).then(d => {
    // Can't get actual node version from here, will show placeholder
  });
}

// Format duration
function formatDur(sec) {
  if (!sec) return '0:00';
  sec = Math.floor(sec);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m + ':' + String(s).padStart(2, '0');
}

// Escape HTML
function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// Show element
function show(id) { document.getElementById(id).classList.remove('hidden'); }

// Hide element
function hide(id) { document.getElementById(id).classList.add('hidden'); }

// Re-upload from results
async function reupload(jobId, shortIndex) {
  const btn = event.target;
  btn.disabled = true;
  btn.textContent = 'Uploading...';
  
  try {
    const res = await fetch('/api/reupload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        shortId: `${jobId}_${shortIndex}_${Date.now()}` 
      })
    });
    
    const data = await res.json();
    if (data.success) {
      alert('Upload successful!');
      location.reload();
    } else {
      alert('Upload failed: ' + data.error);
      btn.disabled = false;
      btn.textContent = '🔄 Re-upload';
    }
  } catch (err) {
    alert('Error: ' + err.message);
    btn.disabled = false;
    btn.textContent = '🔄 Re-upload';
  }
}

// Initial load
showTab('upload');
