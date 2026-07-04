const express = require('express');
const router = express.Router();
const {
  checkUsername,
  signup,
  login,
  forgotPassword,
  verifyOtp,
  resetPassword,
  getDashboardData,
  getLoginLogs,
  deleteAccount
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.get('/check-username', checkUsername);
router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
router.post('/logout', (req, res) => {
  // Since JWT is stateless, logout is handled client-side by deleting the token.
  // This endpoint is just structural representation.
  res.status(200).json({ message: 'Logged out successfully' });
});

router.get('/dashboard', protect, getDashboardData);
router.get('/login-logs', protect, getLoginLogs);
router.delete('/profile', protect, deleteAccount);

module.exports = router;
