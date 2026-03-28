const cron = require('node-cron');
const Email = require('../models/Email');
const Customer = require('../models/Customer');
const Employer = require('../models/Employer');
const { fetchUnreadEmails, markAsRead, sendReply } = require('./gmailService');
const { generateAIReply } = require('./aiAgentService');

let isProcessing = false;
let pollerStartedAt = Math.floor(Date.now() / 1000); // store current time in seconds

const startGmailPoller = () => {
  console.log('Gmail poller started — checking every 30 seconds');

  cron.schedule('*/30 * * * * *', async () => {
    if (isProcessing) {
      console.log('Previous Gmail poll still running, skipping...');
      return;
    }

    try {
      isProcessing = true;
      await processNewEmails();
    } catch (err) {
      console.error('Poller error:', err.message);
    } finally {
      isProcessing = false;
    }
  });
};

const getInboxEmployer = async () => {
  const employer = await Employer.findOne({
    email: process.env.GMAIL_ADDRESS,
    isActive: true,
  });

  if (!employer) {
    throw new Error(`No active employer found for inbox ${process.env.GMAIL_ADDRESS}`);
  }

  return employer;
};

const generateCustomerPassword = () => {
  return `${Math.random().toString(36).slice(-8)}Aa1!`;
};

const processNewEmails = async () => {
  console.log('Checking Gmail...');

  const unreadEmails = await fetchUnreadEmails(pollerStartedAt);

  if (!unreadEmails.length) {
    console.log('No new emails');
    return;
  }

  console.log(`Found ${unreadEmails.length} new email(s)`);

  const employer = await getInboxEmployer();

  for (const email of unreadEmails) {
    try {
      const exists = await Email.findOne({ gmailId: email.gmailId });
      if (exists) {
        await markAsRead(email.gmailId);
        continue;
      }

      let customer = await Customer.findOne({ email: email.fromEmail.toLowerCase(), isActive: true });

      if (!customer) {
        const nameMatch = email.from.match(/^(.+?)\s*</);
        const name = nameMatch ? nameMatch[1].trim() : email.fromEmail.split('@')[0];

        customer = await Customer.create({
          name,
          email: email.fromEmail.toLowerCase(),
          password: generateCustomerPassword(),
        });

        console.log(`New customer saved: ${customer.name} (${email.fromEmail})`);
      }

      await Email.create({
        employerId: employer._id,
        customerId: customer._id,
        gmailId: email.gmailId,
        threadId: email.threadId,
        from: email.from,
        fromEmail: email.fromEmail.toLowerCase(),
        to: email.to,
        subject: email.subject,
        rawBody: email.rawBody,
        body: email.body,
        direction: 'inbound',
        status: 'received',
        emailDate: email.date,
      });

      await markAsRead(email.gmailId);

      console.log(`Saved new email from ${email.fromEmail}`);

      // ── AUTO-REPLY: check customer flag ──────────────────────────────
      if (customer.autoReplyEmail) {
        try {
          // fetch short thread history for context
          const threadHistory = await Email.find({ threadId: email.threadId, isArchived: false })
            .sort({ emailDate: 1 })
            .select('body direction')
            .lean();

          const aiReply = await generateAIReply(
            email.body,
            email.subject,
            customer.name,
            threadHistory,
            customer.email
          );

          // find the saved email doc so we have the _id
          const savedEmail = await Email.findOne({ gmailId: email.gmailId });

          const gmailResponse = await sendReply(
            email.fromEmail,
            email.subject || 'Support Reply',
            aiReply,
            email.threadId
          );

          await Email.create({
            employerId: employer._id,
            customerId: customer._id,
            gmailId: gmailResponse.id,
            threadId: email.threadId,
            from: process.env.GMAIL_ADDRESS,
            fromEmail: process.env.GMAIL_ADDRESS,
            to: email.fromEmail,
            subject: email.subject?.startsWith('Re:') ? email.subject : `Re: ${email.subject || 'Support Reply'}`,
            rawBody: aiReply,
            body: aiReply,
            direction: 'outbound',
            status: 'replied',
            emailDate: new Date(),
          });

          if (savedEmail) {
            await Email.findByIdAndUpdate(savedEmail._id, { status: 'replied' });
          }

          console.log(`[Auto-Reply Email] Sent to ${email.fromEmail}: ${aiReply.slice(0, 60)}...`);
        } catch (autoErr) {
          console.error(`[Auto-Reply Email] Failed for ${email.fromEmail}:`, autoErr.message);
        }
      }
      // ────────────────────────────────────────────────────────────────
    } catch (err) {
      console.error(`Failed processing email ${email.gmailId}:`, err.message);
    }
  }
};

module.exports = { startGmailPoller, processNewEmails };