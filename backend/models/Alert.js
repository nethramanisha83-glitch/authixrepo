const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  threatName: { type: String, required: true },
  severity: { type: String, enum: ['Low', 'Medium', 'Critical'], required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  action: { type: String, required: true },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

const Alert = mongoose.model('Alert', alertSchema);
module.exports = Alert;
