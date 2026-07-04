const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getQuestions,
  getQuestionById,
  createQuestion,
  addAnswer,
  toggleLike,
  deleteQuestion,
  updateAnswer,
  deleteAnswer,
} = require('../controllers/communityController');

// All questions (supports ?category=)
router.get('/questions', getQuestions);

// Single question
router.get('/questions/:id', getQuestionById);

// Protected routes
router.post('/questions', protect, createQuestion);
router.post('/questions/:id/answers', protect, addAnswer);
router.post('/answers/:id/like', protect, toggleLike);
router.delete('/questions/:id', protect, deleteQuestion);
router.put('/answers/:id', protect, updateAnswer);
router.delete('/answers/:id', protect, deleteAnswer);

module.exports = router;
