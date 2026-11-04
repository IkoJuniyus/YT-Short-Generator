const express = require('express');
const { google } = require('googleapis');
const path = require('path');
const config = require('../config');
const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.YT_CLIENT_ID,
  process.env.YT_CLIENT_SECRET,
  'http://localhost:3000/oauth2callback'
);

const SCOPES = ['https://www.googleapis.com/auth/youtube.upload'];

router.get('/youtube/authorize', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
  res.redirect(authUrl);
});

router.get('/oauth2callback', (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send('Authorization code not provided');
  }

  oauth2Client.getToken(code, (err, token) => {
    if (err) {
      return res.status(500).send('Error retrieving access token: ' + err.message);
    }

    oauth2Client.setCredentials(token);

    const credentialsPath = path.join(config.rootDir, 'credentials.json');
    const fs = require('fs');
    if (!fs.existsSync(credentialsPath)) {
      const creds = {
        web: {
          client_id: process.env.YT_CLIENT_ID,
          client_secret: process.env.YT_CLIENT_SECRET,
          redirect_uris: ['http://localhost:3000/oauth2callback'],
        },
      };
      fs.writeFileSync(credentialsPath, JSON.stringify(creds, null, 2));
    }

    const tokenPath = path.join(config.rootDir, 'token.json');
    fs.writeFileSync(tokenPath, JSON.stringify(token));

    res.send(`
      <html>
      <head><title>YouTube Auth Success</title></head>
      <body style="font-family:sans-serif;background:#1a1a1a;color:#fff;text-align:center;padding:40px">
        <h1>✅ YouTube Auth Success!</h1>
        <p>Your channel is now connected.</p>
        <button onclick="window.close()">Close this window</button>
      </body>
      </html>
    `);
  });
});

module.exports = router;
