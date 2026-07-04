const User = require('../models/User');
const Lesson = require('../models/Lesson');
const QuizResult = require('../models/QuizResult');
const Alert = require('../models/Alert');
const Report = require('../models/Report');
const Checklist = require('../models/Checklist');
const LoginLog = require('../models/LoginLog');
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Helper: Call Gemini API ────────────────────────────────────────────────────
const callGemini = async (systemPrompt, userMessage, history = [], retryCount = 1) => {
  const fetch = (await import('node-fetch')).default;
  const apiKey = process.env.VITE_GEMINI_API_KEY;
  
  // Debug log (masked)
  const maskedKey = apiKey ? `...${apiKey.slice(-4)}` : "NOT_FOUND";
  console.log(`Backend VITE_GEMINI_API_KEY loaded: ${maskedKey}`);

  if (!apiKey) throw new Error("VITE_GEMINI_API_KEY is missing in backend env");
  
  // Map history to Gemini format (role is 'user' or 'model')
  const geminiHistory = history.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));
  
  // Add system prompt directly to the final user message
  const lastMsgText = systemPrompt + "\n\n" + userMessage;
  const contents = [...geminiHistory];

  if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
    contents[contents.length - 1].parts[0].text += '\n' + lastMsgText;
  } else {
    contents.push({ role: 'user', parts: [{ text: lastMsgText }] });
  }

  let attempt = 0;
  while (attempt <= retryCount) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7
        }
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data.candidates[0].content.parts[0].text;
    }

    const err = await res.text();
    if (res.status === 429 && attempt < retryCount) {
      console.warn(`Gemini 429 Rate Limit hit. Retrying in 52 seconds... (Attempt ${attempt + 1})`);
      await new Promise(resolve => setTimeout(resolve, 52000));
      attempt++;
      continue;
    }

    throw new Error(`Gemini API error: ${res.status} ${err}`);
  }
};

// ─── Helper: Update streak ────────────────────────────────────────────────────
const updateStreak = async (user) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!user.lastStreakDate) {
    user.loginStreak = 1;
    user.lastStreakDate = today;
    return;
  }
  const lastDate = new Date(user.lastStreakDate);
  const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
  const diffMs = today - lastDay;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 1) {
    user.loginStreak = (user.loginStreak || 0) + 1;
    user.lastStreakDate = today;
  } else if (diffDays > 1) {
    user.loginStreak = 1;
    user.lastStreakDate = today;
  }
  // diffDays === 0 means same day, don't change
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // Update streak
    const user = await User.findById(userId).select('-password');
    await updateStreak(user);
    await user.save();

    // Quiz count and last quiz
    const quizResults = await QuizResult.find({ userId }).sort({ dateTaken: -1 }).limit(5);
    const quizCount = await QuizResult.countDocuments({ userId });

    // Unread alerts count
    const unreadAlerts = await Alert.countDocuments({ readBy: { $ne: userId } });

    // Last lesson completed (via Lesson completedBy)
    const lastLesson = await Lesson.findOne({ completedBy: userId }).sort({ updatedAt: -1 });

    // Login logs (last 5)
    const loginLogs = await LoginLog.find({ username: user.username }).sort({ timestamp: -1 }).limit(5);

    // Category progress
    const categories = ['Phishing', 'Password Safety', 'Social Engineering', 'Public WiFi Risks', 'Data Privacy'];
    const categoryProgress = await Promise.all(categories.map(async (cat) => {
      const lesson = await Lesson.findOne({ category: cat });
      return {
        category: cat,
        completed: lesson ? lesson.completedBy.includes(userId) : false,
      };
    }));

    res.json({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        cybersafetyScore: user.cybersafetyScore || 0,
        badgesEarned: user.badgesEarned || [],
        lessonsCompleted: user.lessonsCompleted || 0,
        profilePic: user.profilePic || '',
        loginStreak: user.loginStreak || 0,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
      quizCount,
      unreadAlerts,
      lastQuiz: quizResults[0] || null,
      lastLesson: lastLesson ? { category: lastLesson.category, title: lastLesson.title } : null,
      categoryProgress,
      loginLogs,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Lesson (with caching) ────────────────────────────────────────────────────
exports.getLesson = async (req, res) => {
  try {
    const { category } = req.params;
    const validCategories = ['Phishing', 'Password Safety', 'Social Engineering', 'Public WiFi Risks', 'Data Privacy'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    // Check cache first
    const cached = await Lesson.findOne({ category });
    if (cached) {
      const userId = req.user._id;
      return res.json({
        lesson: cached,
        isCompleted: cached.completedBy.map(id => id.toString()).includes(userId.toString()),
        fromCache: true,
      });
    }

    // Generate via Claude
    const systemPrompt = `You are a cybersecurity educator for students. Generate a short, simple, beginner-friendly lesson on the topic provided. Include: a brief explanation, 3 real world examples, and 3 safety tips. Keep it engaging and easy to understand.`;
    const content = await callGemini(systemPrompt, `Teach me about: ${category}`);

    // Save to DB (cache)
    const lesson = await Lesson.create({
      category,
      title: `${category} – Cyber Safety Lesson`,
      content,
    });

    res.json({
      lesson,
      isCompleted: false,
      fromCache: false,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Mark Lesson Complete ─────────────────────────────────────────────────────
exports.markLessonComplete = async (req, res) => {
  try {
    const { category } = req.params;
    const userId = req.user._id;

    const lesson = await Lesson.findOne({ category });
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    if (!lesson.completedBy.map(id => id.toString()).includes(userId.toString())) {
      lesson.completedBy.push(userId);
      await lesson.save();
      await User.findByIdAndUpdate(userId, { $inc: { lessonsCompleted: 1 } });
    }

    res.json({ message: 'Lesson marked as complete' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Quiz (proxy QuizAPI) ─────────────────────────────────────────────────────
exports.getQuizQuestions = async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const { difficulty = 'Easy' } = req.query;
    // Note: This specific API key requires api_key (snake_case)
    const url = `https://quizapi.io/api/v1/questions?api_key=${process.env.QUIZAPI_KEY}&tags=cybersecurity&difficulty=${difficulty}&limit=10`;
    const qRes = await fetch(url);
    if (!qRes.ok) throw new Error(`QuizAPI Error: ${qRes.status}`);
    
    let result = await qRes.json();
    
    // Flatten { success: true, data: [...] } if present
    let rawQuestions = Array.isArray(result) ? result : (result.data || []);
    
    // Ensure every question has a .question property (some versions return .text)
    const questions = rawQuestions.map(q => ({
      ...q,
      question: q.question || q.text
    }));

    res.json(questions);
  } catch (error) {
    console.error("Backend Quiz Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ─── Save Quiz Result ─────────────────────────────────────────────────────────
exports.saveQuizResult = async (req, res) => {
  try {
    const userId = req.user._id;
    const { score, totalQuestions, difficulty, category } = req.body;

    // Save result
    await QuizResult.create({ userId, score, totalQuestions, difficulty, category: category || 'cybersecurity' });

    // Recalculate cybersafetyScore (average of all quiz percentages, max 100)
    const allResults = await QuizResult.find({ userId });
    const avgPercent = allResults.reduce((sum, r) => sum + (r.score / (r.totalQuestions || 10)) * 100, 0) / allResults.length;
    const newScore = Math.min(100, Math.round(avgPercent));

    // Badge logic
    const percent = Math.round((score / (totalQuestions || 10)) * 100);
    let newBadge = null;
    if (percent >= 80) newBadge = { name: 'Expert', icon: '🏆' };
    else if (percent >= 50) newBadge = { name: 'Intermediate', icon: '🥈' };
    else newBadge = { name: 'Beginner', icon: '🛡️' };

    const user = await User.findById(userId);
    const alreadyHas = user.badgesEarned.some(b => b.name === newBadge.name);
    const updates = { cybersafetyScore: newScore };
    if (!alreadyHas) {
      updates.$push = { badgesEarned: { ...newBadge, earnedAt: new Date() } };
    }
    await User.findByIdAndUpdate(userId, updates);

    res.json({ message: 'Result saved', newScore, badge: alreadyHas ? null : newBadge });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Alerts ───────────────────────────────────────────────────────────────────
exports.getAlerts = async (req, res) => {
  try {
    const userId = req.user._id;
    const alerts = await Alert.find().sort({ createdAt: -1 });
    const enriched = alerts.map(a => ({
      _id: a._id,
      threatName: a.threatName,
      severity: a.severity,
      category: a.category,
      description: a.description,
      action: a.action,
      isRead: a.readBy.map(id => id.toString()).includes(userId.toString()),
      createdAt: a.createdAt,
    }));
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markAlertRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const alert = await Alert.findById(id);
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    if (!alert.readBy.map(i => i.toString()).includes(userId.toString())) {
      alert.readBy.push(userId);
      await alert.save();
    }
    res.json({ message: 'Alert marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Leaderboard ──────────────────────────────────────────────────────────────
exports.getLeaderboard = async (req, res) => {
  try {
    const users = await User.find({}, 'username profilePic cybersafetyScore badgesEarned lessonsCompleted')
      .sort({ cybersafetyScore: -1 })
      .limit(20);

    const ranked = users.map((u, i) => ({
      rank: i + 1,
      _id: u._id,
      username: u.username,
      profilePic: u.profilePic || '',
      cybersafetyScore: u.cybersafetyScore || 0,
      badgeCount: u.badgesEarned ? u.badgesEarned.length : 0,
      lessonsCompleted: u.lessonsCompleted || 0,
    }));

    res.json(ranked);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Report ───────────────────────────────────────────────────────────────────
exports.submitReport = async (req, res) => {
  try {
    const userId = req.user._id;
    const { threatType, description, screenshotUrl } = req.body;
    const report = await Report.create({ userId, threatType, description, screenshotUrl: screenshotUrl || '' });
    res.status(201).json({ message: 'Report submitted successfully', report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Checklist ────────────────────────────────────────────────────────────────
exports.getChecklist = async (req, res) => {
  try {
    const userId = req.user._id;
    let checklist = await Checklist.findOne({ userId });
    if (!checklist) checklist = { userId, completedItems: [] };
    res.json({ completedItems: checklist.completedItems });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.saveChecklist = async (req, res) => {
  try {
    const userId = req.user._id;
    const { completedItems } = req.body;
    await Checklist.findOneAndUpdate({ userId }, { completedItems }, { upsert: true, new: true });
    res.json({ message: 'Checklist saved' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Profile Picture ──────────────────────────────────────────────────────────
exports.updateProfilePicture = async (req, res) => {
  try {
    const userId = req.user._id;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Relative path for storage and serving
    const imageUrl = `/uploads/${req.file.filename}`;
    
    // Update user in DB and return the full updated user object
    const user = await User.findByIdAndUpdate(
      userId, 
      { profilePic: imageUrl },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'Profile picture updated successfully', 
      imageUrl,
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── AI Chat ──────────────────────────────────────────────────────────────────
exports.aiChat = async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    const systemPrompt = `You are CyberSafe AI, a friendly cybersecurity assistant for students. You only answer questions related to cybersecurity, online safety, phishing, passwords, threats, and digital privacy. If a student asks something unrelated to cybersecurity, politely redirect them back to cyber safety topics. Keep answers short, simple, and student friendly.`;
    const reply = await callGemini(systemPrompt, message, history);
    res.json({ reply });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Seed Alerts ─────────────────────────────────────────────────────────────
exports.seedAlerts = async (req, res) => {
  try {
    const count = await Alert.countDocuments();
    if (count > 0) return res.json({ message: 'Alerts already seeded' });

    const alerts = [
      {
        threatName: 'Phishing Email Campaign',
        severity: 'Critical',
        category: 'Phishing',
        description: 'A large-scale phishing campaign is targeting students with fake university login pages. Attackers are sending emails pretending to be from IT support asking students to verify their accounts.',
        action: 'Do not click links in emails. Go directly to your university portal by typing the URL in your browser. Report suspicious emails to IT immediately.',
      },
      {
        threatName: 'Weak Password Vulnerability',
        severity: 'Medium',
        category: 'Password Safety',
        description: 'Multiple accounts have been compromised due to use of common passwords like "password123" or "student2024". These are easily guessed by automated bots.',
        action: 'Change your password immediately to a strong, unique one with at least 12 characters, including uppercase, lowercase, numbers, and symbols. Use a password manager.',
      },
      {
        threatName: 'Public WiFi Snooping',
        severity: 'Medium',
        category: 'Public WiFi Risks',
        description: 'Attackers have been found setting up fake WiFi hotspots near campus under names like "Campus_Free_WiFi". Connecting to these allows them to intercept your internet traffic.',
        action: 'Only connect to official campus WiFi networks. Use a VPN when on any public network. Avoid accessing sensitive accounts (banking, email) on public WiFi.',
      },
      {
        threatName: 'Social Media Data Scraping',
        severity: 'Low',
        category: 'Data Privacy',
        description: 'Automated bots are harvesting public student profiles from social media platforms to build targeted attack profiles. Oversharing personal information increases your risk of social engineering attacks.',
        action: 'Review your social media privacy settings. Limit public information to only what is necessary. Avoid sharing your schedule, location, or university ID online.',
      },
      {
        threatName: 'Ransomware Alert',
        severity: 'Critical',
        category: 'Malware',
        description: 'A new ransomware strain has been identified targeting student laptops through pirated software and cracked applications downloaded from unofficial sources. Files are encrypted and a ransom is demanded.',
        action: 'Only download software from official sources. Keep your operating system and antivirus updated. Back up important files to the cloud or an external drive regularly. Do not pay ransoms.',
      },
      {
        threatName: 'Social Engineering via Discord',
        severity: 'Medium',
        category: 'Social Engineering',
        description: 'Attackers are posing as fellow students on Discord, offering "free premium accounts" or "homework help" in exchange for login credentials or personal information.',
        action: 'Never share your passwords or personal details with anyone online, even if they appear to be a friend. Verify identities through other channels before trusting anyone with sensitive info.',
      },
    ];

    await Alert.insertMany(alerts);
    res.json({ message: `Seeded ${alerts.length} alerts` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Get Profile ──────────────────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json({
      username: user.username,
      email: user.email,
      profilePic: user.profilePic || '',
      createdAt: user.createdAt,
      cybersafetyScore: user.cybersafetyScore || 0,
      lessonsCompleted: user.lessonsCompleted || 0,
      badgesEarned: user.badgesEarned || [],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Get Cloudinary Signature (for direct frontend upload) ────────────────────
exports.getUploadSignature = async (req, res) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = 'cybersafe_campus';
    const paramsToSign = { timestamp, folder };
    const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET);
    res.json({
      signature,
      timestamp,
      folder,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Remove Profile Picture ──────────────────────────────────────────────────
exports.removeProfilePicture = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.profilePic) {
      const fileName = user.profilePic.split('/').pop();
      const filePath = path.join(__dirname, '..', 'uploads', fileName);
      
      // Delete file from disk if it exists
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    user.profilePic = '';
    await user.save();

    res.json({ 
      message: 'Profile picture removed successfully', 
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePic: ''
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
