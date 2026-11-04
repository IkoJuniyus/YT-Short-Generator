# YouTube Connection Guide

## Langkah 1: Buat Google Cloud Project

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Klik **Select a project** → **New Project**
3. Name: `YT Short Generator`
4. Click **Create**

## Langkah 2: Enable YouTube Data API v3

1. Di sidebar kiri, klik **APIs & Services** → **Library**
2. Cari **YouTube Data API v3**
3. Klik **Enable**

## Langkah 3: Buat OAuth 2.0 Credentials

1. Klik **APIs & Services** → **Credentials**
2. Klik **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Configuration screen: klik **Configure consent screen**
   - App name: `YT Short Generator`
   - User support email: pilih email Anda
   -点击 **Save and Continue**
   - Skip scope add dan click **Save and Continue**
   - Click **Back to dashboard**
4. Kembali ke **Credentials**, klik **+ CREATE CREDENTIALS** → **OAuth client ID**
5. Application type: **Web application**
6. Name: `Local Dev`
7. Authorized redirect URIs: `http://localhost:3000/oauth2callback`
8. Click **Create**
9. Copy **Client ID** dan **Client Secret**

## Langkah 4: Setup Credentials

1. Rename `credentials.example.json` menjadi `credentials.json`
2. Paste Client ID dan Client Secret ke file tersebut

Atau gunakan environment variables:
```bash
YT_CLIENT_ID=your_client_id_here
YT_CLIENT_SECRET=your_client_secret_here
```

## Langkah 5: Authenticate

### Opsi A: Via Terminal (Quick)

```bash
npm run auth:youtube
```

Ikuti link yang muncul, login Google, paste kode yang didapat.

### Opsi B: Via Web UI (Recommended)

1. Buka `http://localhost:3000/youtube/authorize`
2. Login dengan akun YouTube channel Anda
3. Klik **Allow**
4. Setelahauthorize, tab akan close otomatis
5. Token disimpan di `token.json`

## Langkah 6: Enable Auto-Upload

Edit `.env`, ubah:
```
YOUTUBE_ENABLED=true
```

## Troubleshooting

**Error: credentials.json not found**
- Pastikan file `credentials.json` ada di folder project

**Error: Token not found**
- Jalankan `npm run auth:youtube` atau buka `/youtube/authorize`

**Permission denied**
- Pastikan scope `https://www.googleapis.com/auth/youtube.upload` di-approve

**Video tidak muncul**
- Cek privacy setting di `.env` (public/private/unlisted)
