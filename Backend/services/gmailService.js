const { google } = require('googleapis');

/**
 * Build an authenticated Gmail client using stored OAuth2 tokens
 */
const getGmailClient = () => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob'
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
};

/**
 * Fetch unread emails from inbox
 * Returns array of parsed email objects
 */
const fetchUnreadEmails = async () => {
  const gmail = getGmailClient();

  // List unread messages
  const listRes = await gmail.users.messages.list({
    userId: 'me',
    q: `is:unread in:inbox after:${Math.floor((Date.now() - 2 * 60 * 1000) / 1000)}`,
    maxResults: 20,
  });

  const messages = listRes.data.messages || [];
  if (messages.length === 0) return [];

  // Fetch full details for each message
  const emails = await Promise.all(
    messages.map(async (msg) => {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full',
      });

      const headers = detail.data.payload.headers;
      const getHeader = (name) =>
        headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

      // Extract body text
      let body = '';
      const parts = detail.data.payload.parts || [];
      if (parts.length > 0) {
        const textPart = parts.find((p) => p.mimeType === 'text/plain');
        if (textPart?.body?.data) {
          body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
        }
      } else if (detail.data.payload.body?.data) {
        body = Buffer.from(detail.data.payload.body.data, 'base64').toString('utf-8');
      }

      return {
        gmailId:   msg.id,
        threadId:  detail.data.threadId,
        from:      getHeader('From'),       // "John Smith <john@gmail.com>"
        fromEmail: getHeader('From').match(/<(.+)>/)?.[1] || getHeader('From'),
        to:        getHeader('To'),
        subject:   getHeader('Subject'),
        body:      body.trim(),
        date:      new Date(parseInt(detail.data.internalDate)),
        rawSnippet: detail.data.snippet,
      };
    })
  );

  return emails;
};

/**
 * Mark a Gmail message as read (so we don't process it again)
 */
const markAsRead = async (gmailId) => {
  const gmail = getGmailClient();
  await gmail.users.messages.modify({
    userId: 'me',
    id: gmailId,
    requestBody: { removeLabelIds: ['UNREAD'] },
  });
};

/**
 * Send a reply email
 * @param {string} to         - recipient email
 * @param {string} subject    - email subject (usually "Re: original subject")
 * @param {string} body       - reply body text
 * @param {string} threadId   - Gmail thread ID to keep it in same thread
 */
const sendReply = async (to, subject, body, threadId) => {
  const gmail = getGmailClient();

  const fromEmail = process.env.GMAIL_ADDRESS; // employer's gmail

  // Build raw RFC 2822 email
  const raw = [
    `From: ${fromEmail}`,
    `To: ${to}`,
    `Subject: ${subject.startsWith('Re:') ? subject : 'Re: ' + subject}`,
    `Content-Type: text/plain; charset=utf-8`,
    ``,
    body,
  ].join('\n');

  const encodedMessage = Buffer.from(raw)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const result = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage,
      threadId,  // keeps reply in same thread
    },
  });

  return result.data;
};

module.exports = { fetchUnreadEmails, markAsRead, sendReply };