# YT Short Generator

Otomatis generate beberapa YouTube Shorts dari satu video YouTube. Paste URL, tunggu, download hasilnya.

## Cara Kerja

1. Download video dari YouTube via `yt-dlp`
2. Ekstrak subtitle/transcript otomatis
3. Analisis teks untuk menemukan momen menarik (hook words, pertanyaan, klimaks)
4. Potong otomatis jadi beberapa clip < 60 detik
5. Auto-crop ke format vertikal **9:16** (1080x1920) siap upload ke YouTube Shorts / TikTok / Reels
6. Progress real-time di browser

## Prasyarat

- **Node.js** >= 18
- **yt-dlp** — [Install guide](https://github.com/yt-dlp/yt-dlp#installation)
  ```bash
  pip install -U yt-dlp
  ```
- **FFmpeg** (opsional) — project sudah include `ffmpeg-static` sebagai fallback

## Instalasi

```bash
git clone https://github.com/IkoJuniyus/YT-Short-Generator.git
cd YT-Short-Generator
npm install
cp .env.example .env   # sesuaikan jika perlu
```

## Menjalankan

```bash
npm start          # production
npm run dev        # development (auto-reload)
```

Buka `http://localhost:3000` di browser.

## Penggunaan

1. Paste URL YouTube di input
2. Klik **Generate Shorts**
3. Tunggu proses (download → analisis → generate)
4. Download shorts yang sudah jadi

## Teknologi

- Node.js + Express
- yt-dlp (download video + subtitle)
- FFmpeg via fluent-ffmpeg + ffmpeg-static
- EJS + Vanilla JS frontend
- Server-Sent Events (SSE) untuk progress real-time

## Lisensi

MIT
