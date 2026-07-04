const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    unique: true,
    enum: ['Phishing', 'Password Safety', 'Social Engineering', 'Public WiFi Risks', 'Data Privacy'],
  },
  title: { type: String, required: true },
  content: { type: String, required: true },
  completedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

const Lesson = mongoose.model('Lesson', lessonSchema);
module.exports = Lesson;
