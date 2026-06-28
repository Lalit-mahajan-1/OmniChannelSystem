require('dotenv').config();
const mongoose = require('mongoose');
const TicketIntelligence = require('./models/TicketIntelligence');
const Task = require('./models/Task');
const EID = process.env.EMPLOYER_MONGO_ID;

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  await TicketIntelligence.deleteMany({});
  const tickets = [
    { ticketId: 'TK-001', message: 'My account balance is wrong after transfer', channel: 'whatsapp', sentiment: 'negative', urgency: 'high', priority: 'critical', category: 'billing', assignedTeam: 'Finance', suggestedAction: 'Verify transaction logs and reconcile balance', escalationRequired: true, confidence: 0.92, employerId: EID },
    { ticketId: 'TK-002', message: 'ATM card stuck in machine', channel: 'whatsapp', sentiment: 'negative', urgency: 'high', priority: 'high', category: 'technical', assignedTeam: 'Card Services', suggestedAction: 'Block card immediately and issue replacement', escalationRequired: true, confidence: 0.88, employerId: EID },
    { ticketId: 'TK-003', message: 'Want to open a fixed deposit', channel: 'whatsapp', sentiment: 'positive', urgency: 'low', priority: 'low', category: 'general', assignedTeam: 'Deposits', suggestedAction: 'Share FD rate card and assist with online booking', escalationRequired: false, confidence: 0.95, employerId: EID },
    { ticketId: 'TK-004', message: 'Salary not credited for 3 days', channel: 'email', sentiment: 'negative', urgency: 'high', priority: 'critical', category: 'billing', assignedTeam: 'Operations', suggestedAction: 'Escalate to NEFT/RTGS team and contact employer bank', escalationRequired: true, confidence: 0.91, employerId: EID },
    { ticketId: 'TK-005', message: 'Want to close account due to hidden charges', channel: 'whatsapp', sentiment: 'negative', urgency: 'medium', priority: 'high', category: 'complaint', assignedTeam: 'Retention', suggestedAction: 'Offer fee waiver and retention benefits', escalationRequired: false, confidence: 0.87, employerId: EID },
    { ticketId: 'TK-006', message: 'Suspicious call asking for OTP', channel: 'whatsapp', sentiment: 'negative', urgency: 'high', priority: 'critical', category: 'technical', assignedTeam: 'Fraud Prevention', suggestedAction: 'Flag account for monitoring and send fraud awareness SMS', escalationRequired: true, confidence: 0.96, employerId: EID },
    { ticketId: 'TK-007', message: 'Home loan EMI changed without notice', channel: 'whatsapp', sentiment: 'negative', urgency: 'medium', priority: 'medium', category: 'billing', assignedTeam: 'Home Loans', suggestedAction: 'Explain floating rate revision and share revised schedule', escalationRequired: false, confidence: 0.89, employerId: EID },
    { ticketId: 'TK-008', message: 'Need personal loan for medical emergency', channel: 'email', sentiment: 'neutral', urgency: 'high', priority: 'high', category: 'general', assignedTeam: 'Personal Loans', suggestedAction: 'Check pre-approved offers and fast-track disbursement', escalationRequired: false, confidence: 0.93, employerId: EID },
    { ticketId: 'TK-009', message: 'PAN card update request', channel: 'whatsapp', sentiment: 'neutral', urgency: 'low', priority: 'low', category: 'account', assignedTeam: 'KYC Team', suggestedAction: 'Initiate digital KYC verification', escalationRequired: false, confidence: 0.94, employerId: EID },
    { ticketId: 'TK-010', message: 'International transaction declined while abroad', channel: 'whatsapp', sentiment: 'negative', urgency: 'high', priority: 'critical', category: 'technical', assignedTeam: 'Card Services', suggestedAction: 'Enable international transactions and whitelist location', escalationRequired: true, confidence: 0.90, employerId: EID },
    { ticketId: 'TK-011', message: 'Want wealth management consultation', channel: 'email', sentiment: 'positive', urgency: 'low', priority: 'medium', category: 'general', assignedTeam: 'Wealth Management', suggestedAction: 'Schedule appointment with relationship manager', escalationRequired: false, confidence: 0.97, employerId: EID },
    { ticketId: 'TK-012', message: 'Standing instruction setup request', channel: 'whatsapp', sentiment: 'neutral', urgency: 'low', priority: 'low', category: 'general', assignedTeam: 'Operations', suggestedAction: 'Process SI setup and send confirmation', escalationRequired: false, confidence: 0.92, employerId: EID },
  ];
  await TicketIntelligence.insertMany(tickets);
  console.log('Seeded ' + tickets.length + ' ticket intelligence records');

  await Task.deleteMany({});
  const tasks = [
    { title: 'Investigate wrong balance for Aarav Patel', description: 'Customer reports 50000 deducted instead of 25000. Check transaction logs.', status: 'todo', priority: 'critical', assignedTo: EID, createdBy: EID, category: 'billing', channel: 'whatsapp' },
    { title: 'Issue replacement ATM card for Priya Sharma', description: 'Card stuck in ATM. Block old card and courier new one.', status: 'in_progress', priority: 'high', assignedTo: EID, createdBy: EID, category: 'card_services', channel: 'whatsapp' },
    { title: 'Escalate salary credit delay - Ananya Reddy', description: 'Salary not credited for 3 days. EMIs due tomorrow.', status: 'todo', priority: 'critical', assignedTo: EID, createdBy: EID, category: 'operations', channel: 'email', dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000) },
    { title: 'Retention call - Vikram Singh', description: 'Customer wants to close account due to hidden charges.', status: 'todo', priority: 'high', assignedTo: EID, createdBy: EID, category: 'retention', channel: 'whatsapp' },
    { title: 'Fraud alert: Meera Joshi OTP scam', description: 'Customer received suspicious call. Flag account for monitoring.', status: 'in_progress', priority: 'critical', assignedTo: EID, createdBy: EID, category: 'technical', channel: 'whatsapp' },
    { title: 'Process home loan rate switch - Arjun Nair', description: 'Switch from floating to fixed rate. Calculate new EMI.', status: 'todo', priority: 'medium', assignedTo: EID, createdBy: EID, category: 'home_loans', channel: 'whatsapp' },
    { title: 'Setup standing instruction - Sneha Kulkarni', description: 'Monthly 15000 transfer to account 9087654321 on 5th.', status: 'done', priority: 'low', assignedTo: EID, createdBy: EID, category: 'operations', channel: 'whatsapp', completedAt: new Date() },
    { title: 'Fast-track personal loan - Karan Mehta', description: 'Medical emergency. 3L needed within 24hrs.', status: 'todo', priority: 'critical', assignedTo: EID, createdBy: EID, category: 'loans', channel: 'email', dueDate: new Date(Date.now() + 8 * 60 * 60 * 1000) },
    { title: 'Enable intl transactions - Rahul Deshmukh', description: 'Credit card declined abroad. Enable international usage.', status: 'in_progress', priority: 'high', assignedTo: EID, createdBy: EID, category: 'card_services', channel: 'whatsapp' },
    { title: 'Schedule RM meeting - Nisha Agarwal', description: 'Premium customer with 50L+. Arrange meeting at Bandra branch.', status: 'todo', priority: 'medium', assignedTo: EID, createdBy: EID, category: 'wealth', channel: 'email' },
  ];
  await Task.insertMany(tasks);
  console.log('Seeded ' + tasks.length + ' tasks');

  console.log('Done!');
  process.exit(0);
})();
