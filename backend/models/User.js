const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  loginAttempts: {
    type: Number,
    required: true,
    default: 0,
  },
  lockUntil: {
    type: Date,
  },
  lastLogin: {
    type: Date,
  },
  resetPasswordOtp: {
    type: String,
  },
  resetPasswordOtpExpires: {
    type: Date,
  },
  // CyberSafe Campus fields
  cybersafetyScore: {
    type: Number,
    default: 0,
  },
  badgesEarned: [
    {
      name: String,
      icon: String,
      earnedAt: { type: Date, default: Date.now },
    }
  ],
  lessonsCompleted: {
    type: Number,
    default: 0,
  },
  profilePic: {
    type: String,
    default: '',
  },
  loginStreak: {
    type: Number,
    default: 0,
  },
  lastStreakDate: {
    type: Date,
  },
}, { timestamps: true });

// Check if user is currently locked out
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Middleware to hash password before saving if it has been modified
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare entered password with hashed password in DB
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
