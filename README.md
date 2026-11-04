# 🎬 YT Short Generator

**Otomatis generate beberapa YouTube Shorts dari satu video YouTube.** Paste URL, tunggu, download hasilnya — atau auto-upload ke channel YouTube Anda!

## ✨ Fitur

- ✅ Download video dari YouTube via `yt-dlp`
- ✅ Ekstrak subtitle/transcript otomatis
- ✅ Analisis teks untuk menemukan momen menarik (hook words, pertanyaan, klimaks)
- ✅ Potong otomatis jadi beberapa clip < 60 detik
- ✅ Auto-crop ke format vertikal **9:16** (1080x1920) siap upload ke YouTube Shorts / TikTok / Reels
- ✅ Generate caption viral otomatis (hook + CTA + hashtags)
- ✅ Auto-upload ke YouTube channel (opsional)
- ✅ Progress real-time via SSE di browser

## 📋 Prasyarat

- **Node.js** >= 18 (Download: https://nodejs.org/)
- **yt-dlp** — Video downloader
- **Google Cloud Account** (untuk YouTube upload, opsional)

## 🚀 Instalasi

### 1. Clone Repo

```bash
git clone https://github.com/IkoJuniyus/YT-Short-Generator.git
cd YT-Short-Generator
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Install yt-dlp

```bash
pip install -U yt-dlp
```

### 4. Setup Environment

```bash
copy .env.example .env
```

Edit `.env` jika perlu (port, folder, dll).

---

## 🎯 Menjalankan App

```bash
npm start          # production
npm run dev        # development (auto-reload)
```

Buka `http://localhost:3000` di browser.

---

## 🔗 Koneksi YouTube Channel (Auto-Upload)

Jika ingin video Shorts otomatis di-upload ke YouTube channel Anda:

### Langkah 1: Buat Google Cloud Project

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Klik **Select a project** → **New Project**
3. Name: `YT Short Generator`
4. Click **Create**

### Langkah 2: Enable YouTube Data API v3

1. Di sidebar kiri, klik **APIs & Services** → **Library**
2. Cari **YouTube Data API v3**
3. Klik **Enable**

### Langkah 3: Buat OAuth 2.0 Credentials

1. Klik **APIs & Services** → **Credentials**
2. Klik **+ CREATE CREDENTIALS** → **OAuth client ID**
3. **Configure consent screen** (jika ditanya):
   - Application type: **External**
   - App name: `YT Short Generator`
   - User support email: pilih email Anda
   - Save and Continue (skip scope)
4. Kembali ke **Credentials**, klik **+ CREATE CREDENTIALS** → **OAuth client ID**
5. Application type: **Web application**
6. Name: `Local Dev`
7. **Authorized redirect URIs**: `http://localhost:3000/oauth2callback`
8. Click **Create**
9. Copy **Client ID** dan **Client Secret**

### Langkah 4: Setup Credentials File

1. Rename `credentials.example.json` menjadi `credentials.json`
2. Paste Client ID dan Client Secret:

```json
{
  "web": {
    "client_id": "YOUR_CLIENT_ID_HERE.apps.googleusercontent.com",
    "client_secret": "YOUR_CLIENT_SECRET_HERE",
    "redirect_uris": ["http://localhost:3000/oauth2callback"]
  }
}
```

### Langkah 5: Authenticate YouTube

**Opsi A: Via Terminal (Quick)**

```bash
npm run auth:youtube
```

Ikuti link yang muncul, login Google, paste kode yang didapat.

**Opsi B: Via Web Browser (Recommended)**

1. Buka `http://localhost:3000/youtube/authorize`
2. Login dengan akun YouTube channel Anda
3. Klik **Allow**
4. Tab akan close otomatis

### Langkah 6: Enable Auto-Upload

Edit `.env`, ubah:

```
YOUTUBE_ENABLED=true
YOUTUBE_PRIVACY=public   # atau: private, unlisted
```

### Langkah 7: Test Upload

1. Restart app: `npm start`
2. Generate Shorts dari URL YouTube
3. Tunggu sampai status **"Auto-upload ke YouTube..."**
4. Video akan muncul di channel Anda!

---

## 📱 Cara Menggunakan (Setelah Setup Selesai)

1. Buka `http://localhost:3000`
2. Paste URL YouTube di input (misal: `https://youtube.com/watch?v=XXX`)
3. Klik **Generate Shorts**
4. Tunggu proses:
   - Download video
   - Ekstrak subtitle
   - Analisis momen menarik
   - Generate beberapa shorts (9:16)
5. Download hasil (MP4 file) atau auto-upload ke YouTube

---

## 🎨 Teknologi

- **Node.js** + **Express** (backend API)
- **yt-dlp** (download video + subtitle)
- **FFmpeg** via `fluent-ffmpeg` + `ffmpeg-static` (video processing)
- **googleapis** (YouTube Data API v3)
- **EJS** + **Vanilla JS** (frontend)
- **Server-Sent Events (SSE)** untuk progress real-time

---

## 📂 Struktur Folder

```
YT-Short-Generator/
├── app.js                    # Entry point
├── config/
│   └── index.js             # Config & environment variables
├── services/
│   ├── ytdlp.service.js     # Download & subtitle extraction
│   ├── analyzer.service.js  # AI segment detection
│   ├── ffmpeg.service.js    # Video processing (crop 9:16)
│   ├── job.service.js       # Job processor
│   ├── captionGenerator.service.js  # Viral caption generator
│   └── youtube.service.js   # YouTube API upload
├── routes/
│   ├── index.js             # API routes
│   └── youtubeAuth.js       # OAuth2 callback
├── public/
│   ├── css/style.css        # Styles
│   └── js/app.js            # Frontend JS
├── views/
│   └── index.ejs            # Main view
├── temp/                    # Temporary files
├── output/                  # Generated shorts
├── downloads/               # Cached videos
├── logs/                    # Application logs
├── .env                     # Environment (jangan commit!)
├── credentials.json         # Google OAuth (jangan commit!)
├── package.json
└── README.md
```

---

## ⚙️ Environment Variables

`.env` (contoh):

```env
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000

TEMP_FOLDER=./temp
OUTPUT_FOLDER=./output
DOWNLOAD_FOLDER=./downloads
LOG_FOLDER=./logs

YTDLP_PATH=yt-dlp
FFMPEG_PATH=
FFPROBE_PATH=

MAX_CONCURRENT_JOBS=2
MAX_SHORT_DURATION=59
MIN_SHORT_DURATION=15
FILE_TTL_MINUTES=60

# YouTube Auto-Upload
YOUTUBE_ENABLED=true
YOUTUBE_PRIVACY=public
```

---

## 🐛 Troubleshooting

**Error: "credentials.json not found"**
- Copy `credentials.example.json` ke `credentials.json`, isi Client ID/Secret

**Error: "Token not found"**
- Jalankan `npm run auth:youtube` atau buka `/youtube/authorize`

**Upload gagal: "insufficient permissions"**
- Pastikan scope `youtube.upload` di-approve saat authenticate
- Cek `token.json` ada

**Video hanya audio, tanpa gambar**
- Restart app (sudah fix format download mp4)

**Akses diblokir saat authenticate**
- Tambahkan email Anda ke **Test users** di OAuth consent screen

---

## 📝 Lisensi

MIT License — free to use, modify, and distribute.

---

## 🙏 Credits

Built with love for content creators! 🎥

Repo: https://github.com/IkoJuniyus/YT-Short-Generator
