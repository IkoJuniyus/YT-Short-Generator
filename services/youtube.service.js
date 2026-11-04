const { google } = require('googleapis');
const { OAuth2 } = google.auth;
const path = require('path');
const fs = require('fs');
const config = require('../config');

const CREDENTIALS_PATH = path.join(config.rootDir, 'credentials.json');
const TOKEN_PATH = path.join(config.rootDir, 'token.json');

let authClient = null;

async function authorize() {
  if (authClient) return authClient;

  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error('credentials.json not found. Please create OAuth2 credentials in Google Cloud Console.');
  }

  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
  const { client_secret, client_id } = credentials.web;
  const redirectUris = credentials.web.redirect_uris;

  const oauth2Client = new OAuth2(client_id, client_secret, redirectUris[0]);

  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
    oauth2Client.setCredentials(token);
    authClient = oauth2Client;
    return oauth2Client;
  }

  throw new Error('Token not found. Please run authenticate script to authorize.');
}

async function refreshToken() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
  const { client_secret, client_id } = credentials.web;
  const redirectUris = credentials.web.redirect_uris;

  const oauth2Client = new OAuth2(client_id, client_secret, redirectUris[0]);
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
  oauth2Client.setCredentials(token);
  authClient = oauth2Client;
  return oauth2Client;
}

async function authenticate() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
  const { client_secret, client_id } = credentials.web;
  const redirectUris = credentials.web.redirect_uris;

  const oauth2Client = new OAuth2(client_id, client_secret, redirectUris[0]);

  const scopes = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly',
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });

  console.log('Buka URL ini di browser untuk authenticate:');
  console.log(authUrl);
  console.log('\nSetelah authorize, copy kode dan paste di sini:');

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  readline.question('Authorization code: ', (code) => {
    readline.close();
    oauth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oauth2Client.setCredentials(token);
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
      console.log('Token stored to', TOKEN_PATH);
      console.log('Authentication successful!');
    });
  });
}

async function uploadVideo(filePath, title, description, tags, options = {}) {
  const youtube = google.youtube({
    version: 'v3',
    auth: await authorize(),
  });

  const requestBody = {
    snippet: {
      title: title,
      description: description,
      tags: tags,
      categoryId: '24',
    },
    status: {
      privacyStatus: options.privacy || 'private',
      selfDeclaredMadeForKids: false,
    },
  };

  if (options.publishAt) {
    requestBody.status.publishAt = options.publishAt;
  }

  try {
    const response = await youtube.videos.insert({
      part: ['snippet', 'status'],
      notifySubscribers: options.notify ?? false,
      requestBody: requestBody,
      media: {
        body: fs.createReadStream(filePath),
      },
    });

    return {
      success: true,
      videoId: response.data.id,
      status: response.data.status,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
    };
  }
}

module.exports = {
  authorize,
  authenticate,
  refreshToken,
  uploadVideo,
};
