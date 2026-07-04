const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getDashboard,
  getLesson,
  markLessonComplete,
  getQuizQuestions,
  saveQuizResult,
  getAlerts,
  markAlertRead,
  getLeaderboard,
  submitReport,
  getChecklist,
  saveChecklist,
  updateProfilePicture,
  removeProfilePicture,
  getProfile,
  aiChat,
  seedAlerts,
  getUploadSignature,
} = require('../controllers/portalController');

// All protected
router.get('/dashboard', protect, getDashboard);
router.get('/learn/:category', protect, getLesson);
router.post('/learn/:category/complete', protect, markLessonComplete);
router.get('/quiz', protect, getQuizQuestions);
router.post('/quiz/result', protect, saveQuizResult);
router.get('/alerts', protect, getAlerts);
router.post('/alerts/:id/read', protect, markAlertRead);
router.get('/leaderboard', protect, getLeaderboard);
router.post('/report', protect, submitReport);
router.get('/checklist', protect, getChecklist);
router.post('/checklist', protect, saveChecklist);
router.post('/profile/picture', protect, upload.single('profilePic'), updateProfilePicture);
router.delete('/profile/picture', protect, removeProfilePicture);
router.get('/profile', protect, getProfile);
router.post('/ai-chat', protect, aiChat);
router.get('/upload-signature', protect, getUploadSignature);

// Unprotected seed (run once)
router.post('/seed-alerts', seedAlerts);

module.exports = router;
