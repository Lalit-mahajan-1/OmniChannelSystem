const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CustomerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (v) => emailRegex.test(v),
        message: 'Please provide a valid email address',
      },
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
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
      validate: {
        validator: (v) => !v || /^\+?[1-9]\d{6,14}$/.test(v),
        message: 'Please provide a valid phone number',
      },
    },
    dob: {
      type: Date,
      validate: {
        validator: (v) => !v || v < new Date(),
        message: 'Date of birth must be in the past',
      },
    },
    channel_ids: {
      whatsapp: { type: String, sparse: true },
      chat_uid: { type: String, sparse: true },
      social_id: { type: String, sparse: true },
    },
    language: {
      type: String,
      default: 'en',
      enum: {
        values: ['en', 'hi', 'ta', 'te', 'kn', 'ml', 'mr', 'bn', 'gu', 'pa'],
        message: 'Language {VALUE} is not supported',
      },
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

// ---- Indexes for channel lookups ----
CustomerSchema.index({ phone: 1 }, { sparse: true });
CustomerSchema.index({ isActive: 1 });

// ---- Hash password before save ----
CustomerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ---- Hash password before findOneAndUpdate ----
CustomerSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate();

  // Handle both direct and $set wrapped password
  const password = update?.password || update?.$set?.password;

  if (password) {
    const hashed = await bcrypt.hash(password, 12);
    if (update.password) update.password = hashed;
    if (update.$set?.password) update.$set.password = hashed;
  }

  next();
});

// ---- Strip password from JSON output ----
CustomerSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

// ---- Compare password ----
CustomerSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Customer', CustomerSchema);