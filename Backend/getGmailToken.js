/**
 * Run this ONCE to get your refresh token:
 *   node getGmailToken.js
 *
 * It will print a URL — open it in browser, authorize,
 * paste the code back here, and it prints your refresh token.
 * Copy that token into your .env as GMAIL_REFRESH_TOKEN
 */

require('dotenv').config();
const { google } = require('googleapis');
const readline   = require('readline');

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID     || 'YOUR_CLIENT_ID',
  process.env.GMAIL_CLIENT_SECRET || 'YOUR_CLIENT_SECRET',
  'urn:ietf:wg:oauth:2.0:oob'     // desktop app redirect
);

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
});

console.log('\n1. Open this URL in your browser:\n');
console.log(authUrl);
console.log('\n2. Authorize and paste the code below:\n');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('Enter code: ', async (code) => {
  rl.close();
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log('\n✅ Add this to your .env:\n');
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
  } catch (err) {
    console.error('Error getting token:', err.message);
  }
});