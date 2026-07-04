const mongoose = require('mongoose');

const quizResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, default: 10 },
  category: { type: String, default: 'cybersecurity' },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Easy' },
  dateTaken: { type: Date, default: Date.now },
});

const QuizResult = mongoose.model('QuizResult', quizResultSchema);
module.exports = QuizResult;
