const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const CustomerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      default: 'customer',
      immutable: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    
    dob: {
      type: Date,
    },
    // Channel identifiers for omni-channel resolution
    channel_ids: {
      whatsapp:  { type: String, sparse: true },
      chat_uid:  { type: String, sparse: true },
      social_id: { type: String, sparse: true },
    },
    language: {
      type: String,
      default: 'en',
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Hash password before save
CustomerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Hash password before findOneAndUpdate
CustomerSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate();
  if (update.password) {
    update.password = await bcrypt.hash(update.password, 10);
  }
  next();
});

// Instance method: compare password
CustomerSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Customer', CustomerSchema);