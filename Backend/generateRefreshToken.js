const { google } = require("googleapis");
const readline = require("readline");

const CLIENT_ID = process.env.GMAIL_CLIENT_ID || "YOUR_CLIENT_ID";
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || "YOUR_CLIENT_SECRET";
const REDIRECT_URI = "http://localhost";

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const scopes = [
  "https://www.googleapis.com/auth/gmail.modify",
];

const url = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: scopes,
  prompt: "consent",
});

console.log("\nOpen this URL in your browser:\n");
console.log(url);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("\nPaste the authorization code here:\n", async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);

    console.log("\nRefresh Token:");
    console.log(tokens.refresh_token);

    rl.close();
  } catch (err) {
    console.error(err);
  }
});
