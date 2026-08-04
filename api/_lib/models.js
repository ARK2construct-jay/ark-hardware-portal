import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

// Matches the EXISTING userdetail collection field-for-field (fullName, email,
// username, password, createdAt, updatedAt, __v were already present in
// production data). New fields (failedLoginAttempts, lockUntil) are additive —
// existing documents simply don't have them yet, which is fine since they're
// optional with safe defaults.
const userSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    username: { type: String, required: true, trim: true },
    password: { type: String, required: true }, // bcrypt hash OR legacy plaintext
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    isAdmin: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'userdetail' }
);

export const User = models.User || model('User', userSchema);

// New collection for OTP-based password resets. Codes are stored hashed
// (never in plaintext) and expire quickly.
const passwordResetSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'passwordresets' }
);

export const PasswordReset =
  models.PasswordReset || model('PasswordReset', passwordResetSchema);

// The hardware dataset collection (allegion_set) already exists with whatever
// shape the old system put there. strict: false lets us read/write documents
// without needing to know every field ahead of time, so the dashboard can
// adapt to the real schema instead of guessing it.
const hardwareSchema = new Schema(
  {},
  { strict: false, collection: 'allegion_set', timestamps: false }
);

export const Hardware =
  models.Hardware || model('Hardware', hardwareSchema);
