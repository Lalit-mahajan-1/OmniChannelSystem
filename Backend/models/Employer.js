const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EmployerSchema = new mongoose.Schema(
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
      default: 'employer',
      immutable: true,
    },
    company: {
      type: String,
      trim: true,
      maxlength: [200, 'Company name cannot exceed 200 characters'],
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: (v) => !v || /^\+?[1-9]\d{6,14}$/.test(v),
        message: 'Please provide a valid phone number',
      },
    },
    // WhatsApp Business API Phone Number ID
    phoneNumberId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      validate: {
        validator: (v) => !v || /^\d+$/.test(v),
        message: 'phoneNumberId must be a numeric string',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// ---- Indexes ----
EmployerSchema.index({ isActive: 1 });
EmployerSchema.index({ company: 1 });

// ---- Hash password before save ----
EmployerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ---- Hash password before findOneAndUpdate ----
EmployerSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate();

  const password = update?.password || update?.$set?.password;

  if (password) {
    const hashed = await bcrypt.hash(password, 12);
    if (update.password) update.password = hashed;
    if (update.$set?.password) update.$set.password = hashed;
  }

  next();
});

// ---- Strip password and __v from JSON ----
EmployerSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

// ---- Compare password ----
EmployerSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Employer', EmployerSchema);