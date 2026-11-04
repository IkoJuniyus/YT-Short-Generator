const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const config = require('../config');

const CREDENTIALS_PATH = path.join(config.rootDir, 'credentials.json');

if (!fs.existsSync(CREDENTIALS_PATH)) {
  console.error('❌ credentials.json not found!');
  console.log('\n📄 Cara setup:');
  console.log('1. Buka https://console.cloud.google.com/');
  console.log('2. Buat project → Enable YouTube Data API v3');
  console.log('3. Buat OAuth 2.0 Credentials');
  console.log('4. Copy Client ID & Secret ke credentials.json');
  console.log('   (copy dari credentials.example.json)');
  console.log('\n📚 Detail: YOUTUBE_SETUP.md\n');
  process.exit(1);
}

const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
const { client_secret, client_id } = credentials.web;
const redirectUris = credentials.web.redirect_uris;

const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirectUris[0]);

const scopes = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly',
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent',
});

console.log('========================================');
console.log('   YouTube OAuth Authentication');
console.log('========================================\n');
console.log('1. Buka URL ini di browser:');
console.log(authUrl);
console.log('\n2. Login Google dan klik "Allow"');
console.log('\n3. Copy authorization code dari browser\n');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Authorization code: ', (code) => {
  rl.close();
  oauth2Client.getToken(code, (err, token) => {
    if (err) {
      console.error('\n❌ Error:', err.message);
      process.exit(1);
    }
    oauth2Client.setCredentials(token);
    const TOKEN_PATH = path.join(config.rootDir, 'token.json');
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2));
    console.log('\n✅ Token saved to token.json');
    console.log('✅ YouTube authentication successful!\n');
    process.exit(0);
  });
});
