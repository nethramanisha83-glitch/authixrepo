import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Shield, CheckCircle, ChevronRight, Sparkles } from 'lucide-react';

const CATEGORIES = [
  { name: 'Phishing',            emoji: '🎣', desc: 'Spot and avoid phishing scams' },
  { name: 'Password Safety',     emoji: '🔐', desc: 'Create and manage strong passwords' },
  { name: 'Social Engineering',  emoji: '🎭', desc: 'Recognize manipulation tactics' },
  { name: 'Public WiFi Risks',   emoji: '📡', desc: 'Stay safe on public networks' },
  { name: 'Data Privacy',        emoji: '🛡️', desc: 'Protect your personal information' },
];

const ShieldSpinner = () => (
  <div className="flex flex-col items-center gap-4 py-16">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      className="text-5xl"
    >
      🛡️
    </motion.div>
    <p className="text-violet-400 font-medium text-sm animate-pulse">Generating your lesson...</p>
    <p className="text-slate-500 text-xs">CyberSafe AI is crafting a lesson just for you</p>
  </div>
);

const LessonCard = ({ lesson, isCompleted, onMarkComplete, marking }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-card p-6 sm:p-8"
  >
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-bold text-white">{lesson.title}</h2>
      {isCompleted && (
        <span className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
          <CheckCircle size={14} /> Completed
        </span>
      )}
    </div>
    <div className="prose prose-invert max-w-none">
      <div className="whitespace-pre-wrap text-slate-300 text-sm leading-relaxed bg-slate-800/40 rounded-xl p-5 border border-slate-700/40">
        {lesson.content}
      </div>
    </div>
    {!isCompleted && (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onMarkComplete}
        disabled={marking}
        className="mt-6 btn-violet flex items-center gap-2 w-auto px-6 disabled:opacity-50"
      >
        <CheckCircle size={18} />
        {marking ? 'Saving...' : 'Mark as Complete'}
      </motion.button>
    )}
  </motion.div>
);

const LearnPage = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState('');

  const handleSelectCategory = async (cat) => {
    setSelectedCategory(cat);
    setLesson(null);
    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/portal/learn/${encodeURIComponent(cat)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setLesson(data.lesson);
      setIsCompleted(data.isCompleted);
    } catch (e) {
      setError(e.message || 'Failed to load lesson');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    setMarking(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/portal/learn/${encodeURIComponent(selectedCategory)}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsCompleted(true);
    } catch {
      // silent
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 bg-gradient-to-br from-violet-600/10 to-transparent border-violet-500/20">
        <div className="flex items-center gap-3 mb-1">
          <BookOpen size={22} className="text-violet-400" />
          <h1 className="text-2xl font-bold text-white">Cyber Learning Hub</h1>
        </div>
        <p className="text-slate-400 text-sm">Select a category to start learning. AI generates each lesson fresh (cached for speed).</p>
      </motion.div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATEGORIES.map((cat, i) => (
          <motion.button
            key={cat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleSelectCategory(cat.name)}
            className={`glass-card p-5 text-left transition-all duration-200 cursor-pointer hover:border-violet-500/40 ${
              selectedCategory === cat.name ? 'border-violet-500/60 bg-violet-500/10' : ''
            }`}
          >
            <div className="text-3xl mb-3">{cat.emoji}</div>
            <h3 className="text-white font-semibold text-base mb-1 flex items-center gap-2">
              {cat.name}
              {selectedCategory === cat.name && <ChevronRight size={16} className="text-violet-400" />}
            </h3>
            <p className="text-slate-400 text-xs">{cat.desc}</p>
          </motion.button>
        ))}

        {/* AI notice card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-5 border-dashed border-violet-500/20 flex flex-col items-center justify-center gap-2 text-center"
        >
          <Sparkles size={20} className="text-violet-400" />
          <p className="text-slate-400 text-xs">Lessons are AI-generated and cached. First load may take a moment.</p>
        </motion.div>
      </div>

      {/* Lesson Area */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass-card">
            <ShieldSpinner />
          </motion.div>
        )}
        {error && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 border-rose-500/30 bg-rose-500/5">
            <p className="text-rose-400 text-sm">⚠️ {error}</p>
          </motion.div>
        )}
        {lesson && !loading && (
          <LessonCard
            key={lesson._id}
            lesson={lesson}
            isCompleted={isCompleted}
            onMarkComplete={handleMarkComplete}
            marking={marking}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default LearnPage;
