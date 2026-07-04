const mongoose = require('mongoose');

const checklistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  completedItems: [{ type: String }],
}, { timestamps: true });

const Checklist = mongoose.model('Checklist', checklistSchema);
module.exports = Checklist;
