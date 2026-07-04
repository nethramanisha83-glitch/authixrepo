import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import {
  BookOpen, Brain, Bell, CheckSquare, Flame, Trophy,
  GraduationCap, FileText, Medal, ChevronDown, ChevronUp,
  Clock, Monitor, MapPin, ShieldCheck, AlertCircle, Zap
} from 'lucide-react';

const CATEGORIES = ['Phishing', 'Password Safety', 'Social Engineering', 'Public WiFi Risks', 'Data Privacy'];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const getScoreLabel = (score) => {
  if (score <= 40) return { label: 'Beginner', color: '#ef4444' };
  if (score <= 79) return { label: 'Intermediate', color: '#f97316' };
  return { label: 'Expert', color: '#8b5cf6' };
};

const getMotivation = (score) => {
  if (score === 0) return "Start your first quiz to earn your first badge! 🛡️";
  if (score < 30) return "Keep going! Every lesson makes you stronger! 💪";
  if (score < 60) return "You're building great cyber habits! Keep it up! 🔥";
  if (score < 80) return "You are almost a Cyber Expert! Keep going! 🚀";
  return "Outstanding! You're a CyberSafe Champion! 🏆";
};

// Animated count-up hook
const useCountUp = (target, duration = 1500) => {
  const [count, setCount] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const prog = Math.min((ts - start) / duration, 1);
      setCount(Math.round(prog * target));
      if (prog < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);
  return count;
};

const StatCard = ({ icon: Icon, label, value, accent }) => {
  const count = useCountUp(value || 0);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="stat-card"
      style={{ borderTop: `2px solid ${accent}` }}
    >
      <div className="flex items-center gap-2 text-slate-400 text-sm">
        <Icon size={16} style={{ color: accent }} />
        {label}
      </div>
      <p className="text-3xl font-bold text-white animate-count-up">{count}</p>
    </motion.div>
  );
};

const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/portal/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { user, quizCount, unreadAlerts, lastQuiz, lastLesson, categoryProgress, loginLogs } = data || {};
  const score = user?.cybersafetyScore || 0;
  const { label: scoreLabel, color: scoreColor } = getScoreLabel(score);
  const badges = user?.badgesEarned || [];
  const streak = user?.loginStreak || 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero: Greeting + Motivation */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 bg-gradient-to-br from-violet-600/10 to-rose-500/5 border-violet-500/20"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-violet-400 text-sm font-medium mb-1">{getGreeting()},</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {user?.username || 'Student'} 👋
            </h1>
            <p className="text-slate-300 text-sm max-w-lg">{getMotivation(score)}</p>
          </div>
          {/* Streak */}
          {streak > 0 && (
            <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-2xl px-4 py-3 shrink-0">
              <Flame size={22} className="text-orange-400" />
              <div>
                <p className="text-orange-300 font-bold text-lg leading-tight">{streak}</p>
                <p className="text-orange-400/70 text-xs">day streak 🔥</p>
              </div>
            </div>
          )}
        </div>
        {streak > 0 && (
          <p className="text-orange-400 text-xs mt-3 font-medium">
            You are on a {streak} day streak! Don't break it! 🔥
          </p>
        )}
      </motion.div>

      {/* Score + Stats row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Circular Score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 flex flex-col items-center gap-4 lg:col-span-1"
        >
          <p className="text-slate-400 text-sm font-medium">Cyber Safety Score</p>
          <div className="w-36 h-36">
            <CircularProgressbar
              value={score}
              text={`${score}`}
              styles={buildStyles({
                textSize: '22px',
                pathColor: scoreColor,
                textColor: '#f1f5f9',
                trailColor: '#1e293b',
                pathTransitionDuration: 1.5,
              })}
            />
          </div>
          <span
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: `${scoreColor}22`, color: scoreColor, border: `1px solid ${scoreColor}44` }}
          >
            {scoreLabel}
          </span>
        </motion.div>

        {/* Stat Cards */}
        <div className="lg:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={GraduationCap} label="Lessons Completed" value={user?.lessonsCompleted || 0} accent="#8b5cf6" />
          <StatCard icon={FileText}      label="Quizzes Taken"     value={quizCount || 0}             accent="#3b82f6" />
          <StatCard icon={Bell}          label="Unread Alerts"     value={unreadAlerts || 0}           accent="#f43f5e" />
          <StatCard icon={Medal}         label="Badges Earned"     value={badges.length}              accent="#f59e0b" />
        </div>
      </div>

      {/* Badges + Category Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Badges */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <Trophy size={18} className="text-amber-400" /> Recent Badges
            </h2>
            <Link to="/profile" className="text-violet-400 text-xs hover:underline flex items-center gap-1">
              View All <ChevronDown size={12} />
            </Link>
          </div>
          {badges.length === 0 ? (
            <p className="text-slate-500 text-sm">Complete a quiz to earn your first badge! 🛡️</p>
          ) : (
            <div className="space-y-3">
              {badges.slice(-3).reverse().map((b, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-3 badge-glow"
                >
                  <span className="text-2xl">{b.icon}</span>
                  <div>
                    <p className="text-white font-medium text-sm">{b.name} Badge</p>
                    <p className="text-slate-500 text-xs">{new Date(b.earnedAt).toLocaleDateString()}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Category Progress */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card p-6"
        >
          <h2 className="text-white font-semibold mb-5 flex items-center gap-2">
            <BookOpen size={18} className="text-violet-400" /> Learning Progress
          </h2>
          <div className="space-y-4">
            {(categoryProgress || CATEGORIES.map(c => ({ category: c, completed: false }))).map((cp, i) => (
              <div key={cp.category}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">{cp.category}</span>
                  <span className={cp.completed ? 'text-violet-400' : 'text-slate-500'}>
                    {cp.completed ? '✅ Done' : 'Not started'}
                  </span>
                </div>
                <div className="progress-bar-bg h-2">
                  <motion.div
                    className="progress-bar-fill h-full"
                    initial={{ width: 0 }}
                    animate={{ width: cp.completed ? '100%' : '0%' }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6"
      >
        <h2 className="text-white font-semibold mb-5 flex items-center gap-2">
          <Zap size={18} className="text-violet-400" /> Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { to: '/learn',     icon: '📚', label: 'Continue Learning', bg: 'from-violet-600 to-violet-800' },
            { to: '/quiz',      icon: '🧠', label: 'Take a Quiz',       bg: 'from-blue-600 to-blue-800' },
            { to: '/alerts',    icon: '🚨', label: 'View Alerts',       bg: 'from-rose-600 to-rose-800' },
            { to: '/checklist', icon: '✅', label: 'Safety Checklist',  bg: 'from-emerald-600 to-emerald-800' },
          ].map(({ to, icon, label, bg }) => (
            <Link key={to} to={to}>
              <motion.div
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className={`bg-gradient-to-br ${bg} rounded-2xl p-5 text-center cursor-pointer shadow-lg hover:shadow-xl transition-shadow`}
              >
                <div className="text-3xl mb-2">{icon}</div>
                <p className="text-white text-sm font-semibold">{label}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity + Account Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-card p-6"
        >
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Clock size={18} className="text-blue-400" /> Recent Activity
          </h2>
          <div className="space-y-3">
            {lastQuiz && (
              <div className="flex items-start gap-3 bg-slate-800/40 rounded-xl p-3">
                <span className="text-xl">📝</span>
                <div>
                  <p className="text-white text-sm font-medium">Quiz Completed</p>
                  <p className="text-slate-400 text-xs">Score: {lastQuiz.score}/{lastQuiz.totalQuestions || 10} • {lastQuiz.difficulty} • {new Date(lastQuiz.dateTaken).toLocaleDateString()}</p>
                </div>
              </div>
            )}
            {lastLesson && (
              <div className="flex items-start gap-3 bg-slate-800/40 rounded-xl p-3">
                <span className="text-xl">📚</span>
                <div>
                  <p className="text-white text-sm font-medium">Lesson Completed</p>
                  <p className="text-slate-400 text-xs">{lastLesson.category}</p>
                </div>
              </div>
            )}
            {user?.lastLogin && (
              <div className="flex items-start gap-3 bg-slate-800/40 rounded-xl p-3">
                <span className="text-xl">🔐</span>
                <div>
                  <p className="text-white text-sm font-medium">Last Login</p>
                  <p className="text-slate-400 text-xs">{new Date(user.lastLogin).toLocaleString()}</p>
                </div>
              </div>
            )}
            {!lastQuiz && !lastLesson && !user?.lastLogin && (
              <p className="text-slate-500 text-sm">No recent activity yet. Start learning!</p>
            )}
          </div>
        </motion.div>

        {/* Account Info (collapsible) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card overflow-hidden"
        >
          <button
            onClick={() => setAccountOpen(o => !o)}
            className="w-full flex items-center justify-between p-6 text-left"
          >
            <h2 className="text-white font-semibold flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-400" /> Account Info
            </h2>
            {accountOpen ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
          </button>
          {accountOpen && (
            <div className="px-6 pb-6 space-y-4">
              <div>
                <p className="text-slate-500 text-xs mb-1">Email</p>
                <p className="text-slate-200 text-sm">{user?.email}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1">Member Since</p>
                <p className="text-slate-200 text-sm">{new Date(user?.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1">Recent Login Activity</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(loginLogs || []).map((log, i) => (
                    <div key={i} className="flex items-center gap-2 bg-slate-800/40 rounded-lg px-3 py-2">
                      {log.loginStatus === 'success'
                        ? <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                        : <AlertCircle size={14} className="text-red-500 shrink-0" />
                      }
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-300 text-xs capitalize font-medium">{log.loginStatus}</p>
                        <div className="flex items-center gap-2 text-slate-500 text-[10px]">
                          <span className="flex items-center gap-1"><MapPin size={10} /> {log.ipAddress}</span>
                          <span className="flex items-center gap-1"><Monitor size={10} /> {log.browser?.split(' ')[0]}</span>
                        </div>
                      </div>
                      <span className="text-slate-500 text-[10px] shrink-0">{new Date(log.timestamp).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;
