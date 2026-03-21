import { google } from 'googleapis';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const GROQ_KEY    = process.env.GROQ_API_KEY;
const API_BASE    = process.env.API_BASE || 'http://localhost:5000/api';
const EMPLOYER_ID = process.env.EMPLOYER_MONGO_ID;

const getGmailClient = () => {
  const auth = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob'
  );
  auth.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
  return google.gmail({ version: 'v1', auth });
};

const askGroq = async (systemPrompt, userPrompt) => {
  const res = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
      max_tokens: 300,
    },
    {
      headers: {
        Authorization: `Bearer ${GROQ_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return res.data.choices[0].message.content.trim();
};

const getUnrepliedEmails = async () => {
  const res = await axios.get(`${API_BASE}/emails`, {
    params: { employerId: EMPLOYER_ID },
  });
  const all = res.data.data || [];
  return all.filter(e => e.direction === 'inbound' && e.status === 'received');
};

const sendReply = async (gmail, toEmail, subject, replyBody, threadId) => {
  const from = process.env.GMAIL_ADDRESS;
  const raw = [
    `From: ${from}`,
    `To: ${toEmail}`,
    `Subject: ${subject.startsWith('Re:') ? subject : 'Re: ' + subject}`,
    `Content-Type: text/plain; charset=utf-8`,
    ``,
    replyBody,
  ].join('\n');

  const encoded = Buffer.from(raw)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encoded, threadId },
  });
};

const markRepliedInDb = async (emailId, aiReply) => {
  await axios.put(`${API_BASE}/emails/${emailId}`, {
    status:      'replied',
    aiReply,
    aiReplySent: true,
  });
};

const runGmailAgent = async () => {
  console.log('\n========================================');
  console.log('Gmail Agent running...');
  console.log('========================================\n');

  let unreplied;
  try {
    unreplied = await getUnrepliedEmails();
  } catch (err) {
    console.error('Failed to fetch from DB:', err.message);
    return;
  }

  if (!unreplied.length) {
    console.log('No unreplied emails in DB.\n');
    return;
  }

  console.log(`Found ${unreplied.length} unreplied email(s) in DB\n`);

  const gmail = getGmailClient();
  const handled = [];

  for (const email of unreplied) {
    console.log(`── From:    ${email.fromEmail}`);
    console.log(`   Subject: ${email.subject}`);

    const skipSenders = ['no-reply', 'noreply', 'notifications@',
                         'newsletter', 'updates@', 'alerts@', 'mailer'];
    if (skipSenders.some(s => email.fromEmail?.toLowerCase().includes(s))) {
      console.log('   Skipping automated sender.\n');
      await markRepliedInDb(email._id, 'skipped - automated sender');
      continue;
    }

    const aiReply = await askGroq(
      `You are a professional customer support agent.
       Write a helpful, empathetic reply email.
       Keep it under 100 words.
       Do not include subject line.
       Sign off as "Support Team".`,
      `Customer name: ${email.customerId?.name || 'Customer'}
       Subject: ${email.subject}
       Message: ${email.body}`
    );

    console.log(`   Reply:   ${aiReply.slice(0, 80)}...`);

    try {
      await sendReply(gmail, email.fromEmail, email.subject, aiReply, email.threadId);
      console.log('   Status:  SENT');
    } catch (err) {
      console.error('   Send error:', err.message);
      continue;
    }

    await markRepliedInDb(email._id, aiReply);
    console.log('   DB:      Updated to replied\n');
    handled.push({ from: email.fromEmail, subject: email.subject });
  }

  if (handled.length) {
    const summary = await askGroq(
      'Give a 2-3 line summary of customer emails handled.',
      handled.map((h, i) => `${i + 1}. ${h.from} — ${h.subject}`).join('\n')
    );
    console.log('========================================');
    console.log('SESSION SUMMARY:');
    console.log(summary);
    console.log('========================================\n');
  }
};

console.log('Gmail Agent started');
console.log('Flow: MongoDB DB → AI reply → sends email → updates DB');
console.log('Running every 30 seconds...\n');

runGmailAgent();
setInterval(runGmailAgent, 30 * 1000);
