const { google } = require('googleapis');

const getGmailClient = () => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
};

const decodeBase64Url = (str = '') => {
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
};

const extractPlainTextFromPayload = (payload) => {
  if (!payload) return '';

  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  if (payload.parts?.length) {
    for (const part of payload.parts) {
      const text = extractPlainTextFromPayload(part);
      if (text) return text;
    }
  }

  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  return '';
};

const cleanEmailBody = (body = '') => {
  if (!body) return '';

  let cleaned = body.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Remove quoted previous replies
  const replySeparators = [
    /^On .*wrote:$/gim,
    /^From: .*$/gim,
    /^Sent: .*$/gim,
    /^To: .*$/gim,
    /^Subject: .*$/gim,
    /^---+Original Message---+$/gim,
    /^_{5,}$/gim,
  ];

  for (const separator of replySeparators) {
    const match = cleaned.match(separator);
    if (match && match.length) {
      const idx = cleaned.search(separator);
      if (idx > -1) {
        cleaned = cleaned.slice(0, idx);
      }
    }
  }

  // Remove common signature starters
  const signatureSeparators = [
    /\n--\s*\n/g,
    /\nRegards[,\s]*\n/gi,
    /\nBest Regards[,\s]*\n/gi,
    /\nThanks[,\s]*\n/gi,
    /\nThank you[,\s]*\n/gi,
    /\nWarm regards[,\s]*\n/gi,
  ];

  for (const separator of signatureSeparators) {
    const match = cleaned.search(separator);
    if (match > -1) {
      cleaned = cleaned.slice(0, match);
    }
  }

  // Remove disclaimer blocks
  const disclaimerPatterns = [
    /this email and any attachments are confidential[\s\S]*/i,
    /the information contained in this e-mail may be confidential[\s\S]*/i,
    /this message contains confidential information[\s\S]*/i,
    /please consider the environment before printing this email[\s\S]*/i,
    /disclaimer[:\s][\s\S]*/i,
  ];

  for (const pattern of disclaimerPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Remove excessive blank lines
  cleaned = cleaned
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return cleaned;
};

const parseEmailAddress = (fromHeader = '') => {
  const match = fromHeader.match(/<(.+?)>/);
  if (match?.[1]) return match[1].trim();
  return fromHeader.trim();
};

const fetchUnreadEmails = async (afterTimestamp) => {
  const gmail = getGmailClient();

  const listRes = await gmail.users.messages.list({
    userId: 'me',
    q: `is:unread in:inbox after:${afterTimestamp}`,
    maxResults: 20,
  });

  const messages = listRes.data.messages || [];
  if (!messages.length) return [];

  const emails = await Promise.all(
    messages.map(async (msg) => {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full',
      });

      const headers = detail.data.payload?.headers || [];
      const getHeader = (name) =>
        headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

      const rawBody = extractPlainTextFromPayload(detail.data.payload);
      const cleanBody = cleanEmailBody(rawBody);

      return {
        gmailId: msg.id,
        threadId: detail.data.threadId,
        from: getHeader('From'),
        fromEmail: parseEmailAddress(getHeader('From')),
        to: getHeader('To'),
        subject: getHeader('Subject'),
        rawBody: rawBody.trim(),
        body: cleanBody,
        date: new Date(parseInt(detail.data.internalDate, 10)),
        rawSnippet: detail.data.snippet || '',
      };
    })
  );

  return emails;
};

const markAsRead = async (gmailId) => {
  const gmail = getGmailClient();

  await gmail.users.messages.modify({
    userId: 'me',
    id: gmailId,
    requestBody: {
      removeLabelIds: ['UNREAD'],
    },
  });
};

const sendReply = async (to, subject, body, threadId) => {
  const gmail = getGmailClient();
  const fromEmail = process.env.GMAIL_ADDRESS;

  const raw = [
    `From: ${fromEmail}`,
    `To: ${to}`,
    `Subject: ${subject.startsWith('Re:') ? subject : `Re: ${subject}`}`,
    `Content-Type: text/plain; charset=utf-8`,
    '',
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
      threadId,
    },
  });

  return result.data;
};

module.exports = {
  fetchUnreadEmails,
  markAsRead,
  sendReply,
  cleanEmailBody,
};