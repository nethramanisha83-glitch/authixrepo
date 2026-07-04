const mongoose = require('mongoose');

const loginLogSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  ipAddress: {
    type: String,
    required: true,
  },
  browser: {
    type: String,
  },
  loginStatus: {
    type: String,
    enum: ['success', 'failed'],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  }
});

const LoginLog = mongoose.model('LoginLog', loginLogSchema);
module.exports = LoginLog;
