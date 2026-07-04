const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  threatType: { type: String, required: true },
  description: { type: String, required: true },
  screenshotUrl: { type: String, default: '' },
  dateSubmitted: { type: Date, default: Date.now },
});

const Report = mongoose.model('Report', reportSchema);
module.exports = Report;
