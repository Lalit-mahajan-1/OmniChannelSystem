require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Customer = require('./models/Customer');
const Message = require('./models/Message');
const Email = require('./models/Email');

const EMPLOYER_ID = process.env.EMPLOYER_MONGO_ID;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '1182382191621888';

const customers = [
  { name: 'Aarav Patel', email: 'aarav.patel@example.com', phone: '+919876543201', whatsapp: '919876543201', lang: 'en' },
  { name: 'Priya Sharma', email: 'priya.sharma@example.com', phone: '+919876543202', whatsapp: '919876543202', lang: 'hi' },
  { name: 'Rohan Gupta', email: 'rohan.gupta@example.com', phone: '+919876543203', whatsapp: '919876543203', lang: 'en' },
  { name: 'Ananya Reddy', email: 'ananya.reddy@example.com', phone: '+919876543204', whatsapp: '919876543204', lang: 'en' },
  { name: 'Vikram Singh', email: 'vikram.singh@example.com', phone: '+919876543205', whatsapp: '919876543205', lang: 'en' },
  { name: 'Meera Joshi', email: 'meera.joshi@example.com', phone: '+919876543206', whatsapp: '919876543206', lang: 'mr' },
  { name: 'Arjun Nair', email: 'arjun.nair@example.com', phone: '+919876543207', whatsapp: '919876543207', lang: 'en' },
  { name: 'Sneha Kulkarni', email: 'sneha.kulkarni@example.com', phone: '+919876543208', whatsapp: '919876543208', lang: 'en' },
  { name: 'Karan Mehta', email: 'karan.mehta@example.com', phone: '+919876543209', whatsapp: '919876543209', lang: 'en' },
  { name: 'Divya Iyer', email: 'divya.iyer@example.com', phone: '+919876543210', whatsapp: '919876543210', lang: 'ta' },
  { name: 'Rahul Deshmukh', email: 'rahul.deshmukh@example.com', phone: '+919876543211', whatsapp: '919876543211', lang: 'mr' },
  { name: 'Nisha Agarwal', email: 'nisha.agarwal@example.com', phone: '+919876543212', whatsapp: '919876543212', lang: 'en' },
];

const waConversations = [
  { idx: 0, msgs: [
    { body: 'Hi, I want to open a fixed deposit. What are the current FD rates for 1 year?', dir: 'inbound', ago: 45 },
    { body: 'Our current 1-year FD rate is 7.25% for amounts above ₹1L. For senior citizens, it\'s 7.75%. Would you like to proceed?', dir: 'outbound', ago: 40 },
    { body: 'That sounds good. Can I do it online through the app?', dir: 'inbound', ago: 8 },
  ]},
  { idx: 1, msgs: [
    { body: 'मेरा ATM कार्ड काम नहीं कर रहा है। कृपया मदद करें।', dir: 'inbound', ago: 120 },
    { body: 'I understand your ATM card is not working. Could you tell me the last 4 digits of your card so I can check the status?', dir: 'outbound', ago: 115 },
    { body: 'Last 4 digits are 8834. It got stuck in the machine yesterday.', dir: 'inbound', ago: 15 },
  ]},
  { idx: 2, msgs: [
    { body: 'I need a loan against my mutual fund holdings. What is the process and interest rate?', dir: 'inbound', ago: 200 },
    { body: 'We offer loans against MF at 9.5% p.a. You can get up to 50% of your portfolio value. I will need your folio numbers to proceed.', dir: 'outbound', ago: 195 },
    { body: 'My folio is HDFC-MF-88234. Portfolio value is around 12 lakhs.', dir: 'inbound', ago: 25 },
  ]},
  { idx: 3, msgs: [
    { body: 'Why is my salary not credited yet? It is usually by the 1st of every month. Today is the 3rd!', dir: 'inbound', ago: 60 },
    { body: 'I apologize for the concern. Let me check your account. Sometimes employer transfers can take 1-2 extra business days. Can you share your account number?', dir: 'outbound', ago: 55 },
    { body: 'Account number is 5678901234. Please check urgently, I have EMIs due.', dir: 'inbound', ago: 5 },
  ]},
  { idx: 4, msgs: [
    { body: 'I want to close my savings account. Too many hidden charges.', dir: 'inbound', ago: 300 },
    { body: 'I am sorry to hear that, Vikram. May I ask what specific charges are concerning you? We may be able to resolve them.', dir: 'outbound', ago: 295 },
    { body: 'SMS charges ₹25/month, debit card ₹500/year, minimum balance penalty ₹400 last month. This is too much for a basic savings account.', dir: 'inbound', ago: 30 },
  ]},
  { idx: 5, msgs: [
    { body: 'I received a suspicious call claiming to be from your bank asking for my OTP. Is this legitimate?', dir: 'inbound', ago: 10 },
  ]},
  { idx: 6, msgs: [
    { body: 'My home loan EMI amount changed without any prior notification. Can you explain?', dir: 'inbound', ago: 180 },
    { body: 'Home loan EMIs can change when the repo rate is revised by RBI. Your loan is on floating rate. The latest revision was effective from June 1.', dir: 'outbound', ago: 175 },
    { body: 'Can I switch to a fixed rate? What would the EMI be for remaining 15 years at ₹42L outstanding?', dir: 'inbound', ago: 20 },
  ]},
  { idx: 7, msgs: [
    { body: 'I want to set up a standing instruction to transfer ₹15,000 monthly to my daughter\'s account.', dir: 'inbound', ago: 90 },
    { body: 'Sure, I can help with that. I will need the beneficiary account number, IFSC code, and the preferred date of transfer each month.', dir: 'outbound', ago: 85 },
    { body: 'Account: 9087654321, IFSC: HDFC0001234, transfer on 5th of every month. Please set it up.', dir: 'inbound', ago: 12 },
  ]},
  { idx: 8, msgs: [
    { body: 'Is there any pre-approved personal loan offer on my account? I need ₹3L urgently for medical expenses.', dir: 'inbound', ago: 35 },
  ]},
  { idx: 9, msgs: [
    { body: 'I want to update my PAN card details linked to my account. The old PAN has a spelling mistake.', dir: 'inbound', ago: 150 },
    { body: 'You can update your PAN by visiting any branch with the corrected PAN card and a self-attested copy. Alternatively, I can initiate a digital KYC update.', dir: 'outbound', ago: 145 },
    { body: 'Please do the digital KYC. New PAN is BKRPS4521Q. I will upload the document now.', dir: 'inbound', ago: 3 },
  ]},
  { idx: 10, msgs: [
    { body: 'My international transaction on credit card was declined even though I have sufficient limit. I am abroad right now!', dir: 'inbound', ago: 7 },
  ]},
  { idx: 11, msgs: [
    { body: 'I want to enroll for your wealth management service. I have ₹50L in savings and looking for better returns.', dir: 'inbound', ago: 240 },
    { body: 'Welcome to our Premium Wealth Management services! For ₹50L+ portfolios, you get a dedicated relationship manager, priority banking, and customized investment strategies.', dir: 'outbound', ago: 235 },
    { body: 'Sounds perfect. When can I meet the relationship manager? I am available next week.', dir: 'inbound', ago: 18 },
  ]},
];

const emailConversations = [
  { idx: 0, subject: 'FD Rate Inquiry', body: 'Dear Support, I would like to know the current fixed deposit rates for various tenures. Also, is there any special rate for senior citizens? Please share the rate card. Regards, Aarav Patel', dir: 'inbound', ago: 50 },
  { idx: 2, subject: 'Loan Against Mutual Funds - Documentation', body: 'Hi, Following up on my WhatsApp conversation about the loan against mutual funds. Please find attached my latest portfolio statement and KYC documents. Folio: HDFC-MF-88234. Requesting quick processing as I need the funds by next week. Thanks, Rohan Gupta', dir: 'inbound', ago: 30 },
  { idx: 3, subject: 'URGENT - Salary Credit Delay', body: 'This is extremely frustrating. My salary has not been credited for 3 days now. I have EMIs of ₹45,000 due tomorrow and if they bounce, I will be charged penalties. This is completely unacceptable service. I need an immediate resolution or I am switching to another bank. - Ananya Reddy', dir: 'inbound', ago: 8 },
  { idx: 4, subject: 'Account Closure Request', body: 'Dear Team, I wish to formally request the closure of my savings account no. 5678901234. The hidden charges are unacceptable - SMS fees, card fees, and minimum balance penalties totaling over ₹1000 in the last quarter alone. Please process the closure and transfer remaining balance to my other bank account. NEFT details attached. - Vikram Singh', dir: 'inbound', ago: 35 },
  { idx: 6, subject: 'Home Loan - Switch to Fixed Rate', body: 'Dear Home Loan Department, I would like to explore switching my home loan from floating to fixed rate. Current outstanding: ₹42L, remaining tenure: 15 years. Please provide: 1. Fixed rate options 2. Processing fees for conversion 3. New EMI calculation. Regards, Arjun Nair', dir: 'inbound', ago: 22 },
  { idx: 7, subject: 'Standing Instruction Setup Confirmation', body: 'Hi, Just wanted to confirm the standing instruction setup from my WhatsApp chat. Monthly transfer of ₹15,000 to account 9087654321 (IFSC: HDFC0001234) on the 5th of each month. Starting from July 2026. Please send confirmation once activated. Thanks, Sneha Kulkarni', dir: 'inbound', ago: 14 },
  { idx: 8, subject: 'Personal Loan Application - Medical Emergency', body: 'Dear Loans Team, I urgently need a personal loan of ₹3,00,000 for medical expenses. I have been a customer for 5 years with no defaults. My current salary is ₹85,000/month. Is there a pre-approved offer available? I need the disbursement within 24 hours if possible. Please advise on required documents. Karan Mehta', dir: 'inbound', ago: 40 },
  { idx: 9, subject: 'PAN Update - Digital KYC', body: 'Dear KYC Department, I am writing to update my PAN card details. The current PAN linked has a spelling error. New correct PAN: BKRPS4521Q. I have uploaded the scanned copy through your mobile app. Please process the update at the earliest. Regards, Divya Iyer', dir: 'inbound', ago: 6 },
  { idx: 11, subject: 'Wealth Management Consultation - Appointment Request', body: 'Hello, I had a WhatsApp conversation about enrolling in your wealth management service. I have ₹50L+ in savings and am looking for diversified investment options including equity, debt, and gold. I am available next Tuesday or Wednesday for a consultation. Please arrange a meeting with the relationship manager at your Bandra branch. Best, Nisha Agarwal', dir: 'inbound', ago: 20 },
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    if (!EMPLOYER_ID) { console.error('EMPLOYER_MONGO_ID not set'); process.exit(1); }

    const hashedPw = await bcrypt.hash('Customer@123', 12);

    // Create customers
    for (const c of customers) {
      const existing = await Customer.findOne({ email: c.email });
      if (existing) { console.log(`Exists: ${c.name}`); continue; }
      await Customer.create({
        name: c.name, email: c.email, password: hashedPw,
        phone: c.phone, language: c.lang,
        channel_ids: { whatsapp: c.whatsapp },
        consentStatus: { marketing: Math.random() > 0.3, transactional: true, dnc: Math.random() > 0.85 },
        healthScore: Math.floor(40 + Math.random() * 60),
        healthStatus: Math.random() > 0.7 ? 'Watchlist' : Math.random() > 0.9 ? 'At Risk' : 'Healthy',
      });
      console.log(`Created: ${c.name}`);
    }

    // Get all new customers
    const allCustomers = await Customer.find({ email: { $in: customers.map(c => c.email) } });
    const custMap = {};
    allCustomers.forEach(c => { const idx = customers.findIndex(x => x.email === c.email); if (idx >= 0) custMap[idx] = c; });

    // Seed WhatsApp messages
    for (const conv of waConversations) {
      const customer = custMap[conv.idx];
      if (!customer) continue;
      for (const msg of conv.msgs) {
        const ts = new Date(Date.now() - msg.ago * 60 * 1000);
        const msgId = `seed_${customer._id}_${ts.getTime()}_${Math.random().toString(36).slice(2, 6)}`;
        try {
          await Message.create({
            employerId: EMPLOYER_ID, customerId: customer._id,
            from: msg.dir === 'inbound' ? customer.channel_ids.whatsapp : PHONE_NUMBER_ID,
            to: msg.dir === 'inbound' ? PHONE_NUMBER_ID : customer.channel_ids.whatsapp,
            messageId: msgId, type: 'text', body: msg.body,
            direction: msg.dir, status: msg.dir === 'inbound' ? 'received' : 'sent',
            whatsappTimestamp: ts,
          });
        } catch (e) { if (e.code !== 11000) console.error(e.message); }
      }
      console.log(`WA msgs: ${customer.name} (${conv.msgs.length})`);
    }

    // Seed Email messages
    for (const em of emailConversations) {
      const customer = custMap[em.idx];
      if (!customer) continue;
      const ts = new Date(Date.now() - em.ago * 60 * 1000);
      try {
        await Email.create({
          employerId: EMPLOYER_ID, customerId: customer._id,
          gmailId: `seed_email_${customer._id}_${ts.getTime()}`,
          threadId: `thread_${customer._id}_${em.subject.replace(/\s/g, '_').slice(0, 20)}`,
          from: em.dir === 'inbound' ? customer.email : (process.env.GMAIL_ADDRESS || 'support@convosphere.com'),
          fromEmail: em.dir === 'inbound' ? customer.email : (process.env.GMAIL_ADDRESS || 'support@convosphere.com'),
          to: em.dir === 'inbound' ? (process.env.GMAIL_ADDRESS || 'support@convosphere.com') : customer.email,
          subject: em.subject, body: em.body, rawBody: em.body,
          direction: em.dir, status: 'received',
          emailDate: ts,
        });
        console.log(`Email: ${customer.name} — ${em.subject}`);
      } catch (e) { if (e.code !== 11000) console.error(e.message); }
    }

    const totalCustomers = await Customer.countDocuments();
    const totalMsgs = await Message.countDocuments();
    const totalEmails = await Email.countDocuments();
    console.log(`\nDone — ${totalCustomers} customers, ${totalMsgs} WA messages, ${totalEmails} emails`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
