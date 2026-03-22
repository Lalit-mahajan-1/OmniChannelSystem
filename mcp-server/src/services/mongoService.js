import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

let connected = false;

export async function connectMongo() {
  if (connected) return;
  await mongoose.connect(process.env.MONGO_URI);
  connected = true;
  console.log('[MCP] Connected to shared MongoDB');
}

// ── READ teammate's existing collections ──────────────────────────
//
//  Teammate's model names  →  actual collection names (Mongoose pluralises):
//    mongoose.model('Email', ...)          →  emails
//    mongoose.model('Message', ...)        →  messages        (WhatsApp messages)
//    mongoose.model('SocialComplaint', ...) → socialcomplaints
//    mongoose.model('Customer', ...)       →  customers
//
//  strict:false lets us query any field without redeclaring the full schema.

const EmailSchema = new mongoose.Schema({}, {
  strict: false,
  collection: 'emails'        // Email.js → mongoose.model('Email', …)
});

const MessageSchema = new mongoose.Schema({}, {
  strict: false,
  collection: 'messages'      // Message.js → mongoose.model('Message', …)
                              // NOTE: NOT 'conversations' — the real collection is 'messages'
});

const SocialSchema = new mongoose.Schema({}, {
  strict: false,
  collection: 'socialcomplaints'  // SocialComplaint.js → mongoose.model('SocialComplaint', …)
});

const CustomerSchema = new mongoose.Schema({}, {
  strict: false,
  collection: 'customers'     // Customer.js → mongoose.model('Customer', …)
});

// Use mongoose.models cache to avoid OverwriteModelError on hot-reloads
export const Email    = mongoose.models.MCPEmail    || mongoose.model('MCPEmail',    EmailSchema);
export const WAMsg    = mongoose.models.MCPWAMsg    || mongoose.model('MCPWAMsg',    MessageSchema);
export const Social   = mongoose.models.MCPSocial   || mongoose.model('MCPSocial',   SocialSchema);
export const Customer = mongoose.models.MCPCustomer || mongoose.model('MCPCustomer', CustomerSchema);

// ── WRITE to your OWN new collection (no conflict) ─────────────────
const MCPEventSchema = new mongoose.Schema({
  customerId:  String,
  channel:     String,    // 'whatsapp' | 'linkedin' | 'twitter'
  direction:   String,    // 'inbound' | 'outbound'
  content:     String,
  summary:     String,
  sentiment:   String,    // 'positive' | 'neutral' | 'negative' | 'angry'
  intent:      String,    // 'complaint' | 'query' | 'feedback' | 'praise'
  isResolved:  { type: Boolean, default: false },
  metadata:    mongoose.Schema.Types.Mixed,
  createdAt:   { type: Date, default: Date.now }
});

export const MCPEvent = mongoose.models.MCPEvent
  || mongoose.model('MCPEvent', MCPEventSchema);
