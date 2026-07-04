const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const LoginLog = require('../models/LoginLog');
const sendEmail = require('../utils/emailService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

const getClientIp = (req) => {
  return req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
};

// Check username availability
exports.checkUsername = async (req, res, next) => {
  try {
    const { username } = req.query;
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(200).json({ available: false, message: 'Username is already taken' });
    }
    res.status(200).json({ available: true, message: 'Username is available' });
  } catch (error) {
    next(error);
  }
};

// Signup
exports.signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const userExists = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (userExists) {
      if (userExists.username === username) {
         return res.status(400).json({ message: 'Username already exists' });
      }
      return res.status(400).json({ message: 'Email already exists' });
    }

    const user = await User.create({
      username,
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be username or email
    
    // Find user by either email or username
    const user = await User.findOne({ 
      $or: [{ email: identifier }, { username: identifier }] 
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if account is locked
    if (user.isLocked) {
      const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / 60000); // minutes
      return res.status(403).json({ 
        message: `Account is temporarily locked due to multiple failed login attempts. Try again in ${lockTimeRemaining} minutes.` 
      });
    }

    const isMatch = await user.matchPassword(password);

    if (isMatch) {
      // Successful login
      // Reset attempts and lock
      user.loginAttempts = 0;
      user.lockUntil = undefined;
      user.lastLogin = Date.now();
      await user.save();

      // Log successful attempt
      await LoginLog.create({
        username: user.username,
        ipAddress: getClientIp(req),
        browser: req.headers['user-agent'] || 'unknown',
        loginStatus: 'success'
      });

      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      // Failed login
      user.loginAttempts += 1;
      let lockWarning = '';

      if (user.loginAttempts >= 5) {
        // Lock the account for 15 minutes
        user.lockUntil = Date.now() + 15 * 60 * 1000;
        
        // Log the failed (locking) attempt
        await LoginLog.create({
          username: user.username,
          ipAddress: getClientIp(req),
          browser: req.headers['user-agent'] || 'unknown',
          loginStatus: 'failed'
        });

        await user.save();

        // Send email notification about lock
        try {
          await sendEmail({
            email: user.email,
            subject: 'Security Alert: Account Temporarily Locked',
            message: `Hi ${user.username},\n\nYour account has been temporarily locked for 15 minutes due to 5 consecutive failed login attempts.\n\nTime: ${new Date().toLocaleString()}\n\nIf this was not you, please reset your password immediately using the 'Forgot Password' link on the login page.`,
          });
        } catch (emailErr) {
          console.error('Lock email failed to send:', emailErr);
        }

        return res.status(403).json({ 
          message: 'Account locked for 15 minutes due to too many failed attempts' 
        });
      }

      await user.save();

      // Log the failed attempt
      await LoginLog.create({
        username: user.username,
        ipAddress: getClientIp(req),
        browser: req.headers['user-agent'] || 'unknown',
        loginStatus: 'failed'
      });

      res.status(401).json({ 
        message: `Invalid credentials. ${5 - user.loginAttempts} attempts remaining.` 
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Forgot Password - Generate OTP
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash OTP before saving
    const hashedOtp = await crypto.createHash('sha256').update(otp).digest('hex');

    user.resetPasswordOtp = hashedOtp;
    user.resetPasswordOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Send OTP email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset OTP',
        message: `Your password reset OTP is: ${otp}\n\nIt is valid for 10 minutes.\nIf you did not request this, please ignore this email.`,
      });
      res.status(200).json({ message: 'OTP sent to email' });
    } catch (err) {
      console.error('Email send error:', err); // Log the actual error
      user.resetPasswordOtp = undefined;
      user.resetPasswordOtpExpires = undefined;
      await user.save();
      return res.status(500).json({ message: 'Email could not be sent' });
    }

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email });

    if (!user || !user.resetPasswordOtp || !user.resetPasswordOtpExpires) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    if (Date.now() > user.resetPasswordOtpExpires) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    const hashedOtp = await crypto.createHash('sha256').update(otp).digest('hex');

    if (user.resetPasswordOtp !== hashedOtp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // OTP verified successfully (we map this to returning a valid token or just success status)
    // To allow reset password in the next step, we could create a short-lived reset token,
    // or just let the reset step provide OTP again. For simplicity, we just confirm verification,
    // but the actual resetting will verify the OTP again.
    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });

    if (!user || !user.resetPasswordOtp || !user.resetPasswordOtpExpires) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    if (Date.now() > user.resetPasswordOtpExpires) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    const hashedOtp = await crypto.createHash('sha256').update(otp).digest('hex');

    if (user.resetPasswordOtp !== hashedOtp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Set new password (the pre-save middleware will hash it)
    user.password = newPassword;
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpires = undefined;
    // Optionally unlock account if it was locked due to forgot password request
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    
    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Dashboard Data (Protected)
exports.getDashboardData = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Login Logs (Protected)
exports.getLoginLogs = async (req, res) => {
  try {
    // Fetch last 5 logs for this user
    const logs = await LoginLog.find({ username: req.user.username })
                               .sort({ timestamp: -1 })
                               .limit(5);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Account (Protected)
exports.deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Completely remove the user
    await User.findByIdAndDelete(req.user._id);
    
    // Optional: Delete associated login logs
    await LoginLog.deleteMany({ username: user.username });

    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
