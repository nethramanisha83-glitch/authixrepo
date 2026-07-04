import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Users, Search, Plus, ThumbsUp, MessageCircle, 
  Trash2, X, ChevronRight, Filter, Send, Clock, Pencil 
} from 'lucide-react';

const CATEGORIES = ['All', 'Phishing', 'Malware', 'Passwords', 'Network Security', 'Social Engineering', 'Data Privacy'];

// ─── Helper: Time Ago ────────────────────────────────────────────────────────
const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
};

// ─── Helper: Initials Avatar ────────────────────────────────────────────────
const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

const CommunityPage = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [showAskModal, setShowAskModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Form states
  const [newQuestion, setNewQuestion] = useState({ title: '', body: '', category: 'Phishing' });
  const [newAnswer, setNewAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit/Delete answer states
  const [editingAnswerId, setEditingAnswerId] = useState(null);
  const [editingAnswerBody, setEditingAnswerBody] = useState('');
  const [deletingAnswerId, setDeletingAnswerId] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    fetchUserData();
    fetchQuestions();
  }, [filter]);

  const fetchUserData = () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('/api/portal/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setCurrentUser(d))
      .catch(() => {});
  };

  const fetchQuestions = async () => {
    setLoading(true);
    const url = filter === 'All' ? '/api/community/questions' : `/api/community/questions?category=${filter}`;
    try {
      const r = await fetch(url);
      const d = await r.json();
      setQuestions(Array.isArray(d) ? d : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.title || !newQuestion.body) return;
    setSubmitting(true);
    const token = localStorage.getItem('token');
    try {
      const r = await fetch('/api/community/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newQuestion)
      });
      if (r.ok) {
        setShowAskModal(false);
        setNewQuestion({ title: '', body: '', category: 'Phishing' });
        fetchQuestions();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm("Are you sure you want to delete this question and all its answers?")) return;
    const token = localStorage.getItem('token');
    try {
      const r = await fetch(`/api/community/questions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (r.ok) {
        if (selectedQuestion?._id === id) setSelectedQuestion(null);
        fetchQuestions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostAnswer = async (e) => {
    e.preventDefault();
    if (!newAnswer.trim() || !selectedQuestion) return;
    setSubmitting(true);
    const token = localStorage.getItem('token');
    try {
      const r = await fetch(`/api/community/questions/${selectedQuestion._id}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ body: newAnswer })
      });
      if (r.ok) {
        const updated = await r.json();
        setSelectedQuestion(updated);
        setNewAnswer('');
        fetchQuestions(); // Update answer count in list
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLike = async (answerId) => {
    if (!currentUser) return;
    const token = localStorage.getItem('token');
    try {
      const r = await fetch(`/api/community/answers/${answerId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (r.ok) {
        const updated = await r.json();
        setSelectedQuestion(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditAnswer = (ans) => {
    setEditingAnswerId(ans._id);
    setEditingAnswerBody(ans.body);
  };

  const handleCancelEdit = () => {
    setEditingAnswerId(null);
    setEditingAnswerBody('');
  };

  const handleSaveAnswer = async () => {
    if (!editingAnswerBody.trim()) return;
    setEditSubmitting(true);
    const token = localStorage.getItem('token');
    try {
      const r = await fetch(`/api/community/answers/${editingAnswerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ body: editingAnswerBody })
      });
      if (r.ok) {
        const updated = await r.json();
        setSelectedQuestion(updated);
        setEditingAnswerId(null);
        setEditingAnswerBody('');
        fetchQuestions();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteAnswer = async () => {
    if (!deletingAnswerId) return;
    const token = localStorage.getItem('token');
    try {
      const r = await fetch(`/api/community/answers/${deletingAnswerId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (r.ok) {
        const updated = await r.json();
        setSelectedQuestion(updated);
        setDeletingAnswerId(null);
        fetchQuestions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* ─── Motivational Banner ─── */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 bg-gradient-to-r from-[#D5B4E7]/20 to-transparent border-[#D5B4E7]/30 relative overflow-hidden group"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#D5B4E7] rounded-lg shadow-lg shadow-[#D5B4E7]/20">
              <Users size={24} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Student Community</h1>
          </div>
          <p className="text-slate-300 max-w-2xl text-lg">
            Ask questions, share your cybersecurity knowledge, and help your fellow students build a safer digital campus.
          </p>
          {currentUser && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAskModal(true)}
              className="mt-6 flex items-center gap-2 px-6 py-3 bg-[#D5B4E7] hover:bg-[#B697CB] text-slate-900 rounded-xl font-bold transition-all shadow-lg shadow-[#D5B4E7]/20"
            >
              <Plus size={20} /> Ask a Question
            </motion.button>
          )}
        </div>
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
          <MessageSquare size={160} className="text-[#D5B4E7]" />
        </div>
      </motion.div>

      {/* ─── Category Filter ─── */}
      <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/50 rounded-xl border border-slate-700/50 text-slate-400 text-sm whitespace-nowrap">
          <Filter size={14} /> Filter by:
        </div>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap border ${
              filter === cat 
                ? 'bg-[#D5B4E7] border-[#D5B4E7] text-slate-900 shadow-lg shadow-[#D5B4E7]/20' 
                : 'bg-slate-900/50 border-slate-700/50 text-slate-400 hover:border-[#D5B4E7]/50 hover:text-[#D5B4E7]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ─── Questions List ─── */}
    {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-[#D5B4E7] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Loading discussions...</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-20 glass-card border-slate-800">
          <div className="p-4 bg-slate-900 rounded-full w-fit mx-auto mb-4">
            <Search size={32} className="text-slate-700" />
          </div>
          <h3 className="text-white text-xl font-bold">No questions found</h3>
          <p className="text-slate-500 mt-2">Be the first to ask a question in this category!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {questions.map((q, i) => (
              <motion.div
                key={q._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-5 hover:border-teal-500/40 transition-all group flex flex-col justify-between"
              >
                <div className="relative">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      q.category === 'Phishing' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                      q.category === 'Malware' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      q.category === 'Passwords' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                      'bg-[#D5B4E7]/10 text-[#D5B4E7] border border-[#D5B4E7]/20'
                    }`}>
                      {q.category}
                    </div>
                    {currentUser?.username === q.authorName && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteQuestion(q._id); }}
                        className="p-1.5 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Delete Question"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-[#D5B4E7] transition-colors">
                    {q.title}
                  </h3>
                  <p className="text-slate-400 text-sm line-clamp-2 mb-4 leading-relaxed">
                    {q.body}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800/50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D5B4E7] to-[#B697CB] flex items-center justify-center text-[10px] font-bold text-slate-900 shadow-lg">
                      {getInitials(q.authorName)}
                    </div>
                    <div>
                      <p className="text-slate-200 text-xs font-bold">{q.authorName}</p>
                      <p className="text-slate-500 text-[10px] flex items-center gap-1">
                        <Clock size={10} /> {timeAgo(q.createdAt)}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={async () => {
                      setSelectedQuestion(q);
                      try {
                        const r = await fetch(`/api/community/questions/${q._id}`);
                        const fullQ = await r.json();
                        setSelectedQuestion(fullQ);
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-[#D5B4E7] text-slate-300 hover:text-slate-900 rounded-xl text-xs font-bold transition-all"
                  >
                    <MessageCircle size={14} />
                    {(q.answers || []).length} {(q.answers || []).length === 1 ? 'Answer' : 'Answers'}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ─── Question Detail View Overlay ─── */}
      <AnimatePresence>
        {selectedQuestion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedQuestion(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-3xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#D5B4E7]/10 rounded-lg text-[#D5B4E7]">
                    <MessageCircle size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-white truncate max-w-md">Question Details</h2>
                </div>
                <button onClick={() => setSelectedQuestion(null)} className="p-2 text-slate-500 hover:text-white bg-slate-800 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {/* Main Question */}
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="px-3 py-1 rounded-lg bg-[#D5B4E7]/10 text-[#D5B4E7] text-[10px] font-bold uppercase border border-[#D5B4E7]/20">
                      {selectedQuestion.category}
                    </span>
                    <span className="text-slate-500 text-xs flex items-center gap-1">
                      <Clock size={12} /> {new Date(selectedQuestion.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-white">{selectedQuestion.title}</h1>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{selectedQuestion.body}</p>
                  
                  <div className="flex items-center gap-3 pt-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D5B4E7] to-[#B697CB] flex items-center justify-center font-bold text-slate-900 shadow-lg">
                      {getInitials(selectedQuestion.authorName)}
                    </div>
                    <div>
                      <p className="text-white text-sm font-bold">{selectedQuestion.authorName}</p>
                      <p className="text-slate-500 text-xs">Author</p>
                    </div>
                  </div>
                </div>

                {/* Answers Section */}
                <div className="pt-8 border-t border-slate-800 space-y-6">
                  <h3 className="text-white font-bold flex items-center gap-2">
                    <ChevronRight size={18} className="text-[#D5B4E7]" /> 
                    Answers ({selectedQuestion.answers.length})
                  </h3>
                  
                  {selectedQuestion.answers.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-8 bg-slate-950/30 rounded-2xl border border-dashed border-slate-800">
                      No answers yet. Share your knowledge!
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {selectedQuestion.answers.map((ans) => (
                        <div key={ans._id} className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="w-7 h-7 rounded-full bg-[#D5B4E7]/20 flex items-center justify-center text-[10px] font-bold text-[#D5B4E7]">
                                {getInitials(ans.authorName)}
                              </div>
                              <span className="text-slate-200 text-xs font-bold">{ans.authorName}</span>
                              <span className="text-slate-600 text-xs">• {timeAgo(ans.createdAt)}</span>
                              {ans.updatedAt && (
                                <span className="text-[#D5B4E7]/60 text-[10px] italic">(edited)</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Edit & Delete icons — author only */}
                              {currentUser?.username === ans.authorName && editingAnswerId !== ans._id && (
                                <>
                                  <button
                                    onClick={() => handleEditAnswer(ans)}
                                    className="p-1.5 text-slate-600 hover:text-[#D5B4E7] hover:bg-[#D5B4E7]/10 rounded-lg transition-all"
                                    title="Edit Answer"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    onClick={() => setDeletingAnswerId(ans._id)}
                                    className="p-1.5 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                    title="Delete Answer"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </>
                              )}
                              <button 
                                onClick={() => handleToggleLike(ans._id)}
                                disabled={!currentUser}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                                  currentUser && ans.likes.includes(currentUser._id)
                                    ? 'bg-[#D5B4E7] border-[#D5B4E7] text-slate-900'
                                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-[#D5B4E7] hover:border-[#D5B4E7]/50'
                                }`}
                              >
                                <ThumbsUp size={12} />
                                {ans.likes.length}
                              </button>
                            </div>
                          </div>
                          {/* Inline Edit Mode */}
                          {editingAnswerId === ans._id ? (
                            <div className="space-y-3">
                              <textarea
                                value={editingAnswerBody}
                                onChange={(e) => setEditingAnswerBody(e.target.value)}
                                className="w-full bg-slate-900 border border-[#D5B4E7]/40 rounded-xl py-3 px-4 text-slate-200 text-sm focus:outline-none focus:border-[#D5B4E7] transition-all resize-none min-h-[80px]"
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={handleSaveAnswer}
                                  disabled={editSubmitting || !editingAnswerBody.trim()}
                                  className="px-4 py-2 bg-[#D5B4E7] hover:bg-[#B697CB] disabled:opacity-50 text-slate-900 rounded-xl text-xs font-bold shadow-lg shadow-[#D5B4E7]/20 transition-all"
                                >
                                  {editSubmitting ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-slate-300 text-sm leading-relaxed">{ans.body}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Reply Input */}
              {currentUser ? (
                <div className="p-6 bg-slate-950/50 border-t border-slate-800">
                  <form onSubmit={handlePostAnswer} className="relative">
                    <textarea 
                      value={newAnswer}
                      onChange={(e) => setNewAnswer(e.target.value)}
                      placeholder="Write your answer here..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-4 pr-16 text-slate-200 text-sm focus:outline-none focus:border-[#D5B4E7] transition-all resize-none min-h-[100px]"
                    />
                    <button 
                      type="submit"
                      disabled={submitting || !newAnswer.trim()}
                      className="absolute bottom-4 right-4 p-3 bg-[#D5B4E7] hover:bg-[#B697CB] disabled:opacity-50 disabled:hover:bg-[#D5B4E7] text-slate-900 rounded-xl shadow-lg transition-all"
                    >
                      {submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={20} />}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="p-6 bg-slate-950/50 border-t border-slate-800 text-center">
                  <p className="text-slate-500 text-sm">Please <a href="/login" className="text-[#D5B4E7] hover:underline">login</a> to participate in discussions.</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Delete Answer Confirmation Dialog ─── */}
      <AnimatePresence>
        {deletingAnswerId && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeletingAnswerId(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-center space-y-5"
            >
              <div className="mx-auto w-14 h-14 bg-rose-500/10 rounded-full flex items-center justify-center">
                <Trash2 size={28} className="text-rose-500" />
              </div>
              <h3 className="text-white text-lg font-bold">Delete Answer?</h3>
              <p className="text-slate-400 text-sm">Are you sure you want to delete this answer? This action cannot be undone.</p>
              <div className="flex items-center gap-3 justify-center pt-2">
                <button
                  onClick={() => setDeletingAnswerId(null)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAnswer}
                  className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-500/20 transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Ask Question Modal ─── */}
      <AnimatePresence>
        {showAskModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAskModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Ask a Question</h2>
                <button onClick={() => setShowAskModal(false)} className="p-2 text-slate-500 hover:text-white bg-slate-800 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAskQuestion} className="space-y-4">
                <div>
                  <label className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-2">Title</label>
                  <input 
                    type="text"
                    required
                    value={newQuestion.title}
                    onChange={(e) => setNewQuestion(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. How to identify a phishing email?"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-[#D5B4E7] transition-all font-medium"
                  />
                </div>
                
                <div>
                  <label className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-2">Category</label>
                  <select 
                    value={newQuestion.category}
                    onChange={(e) => setNewQuestion(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-[#D5B4E7] transition-all font-medium appearance-none"
                  >
                    {CATEGORIES.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-2">Body</label>
                  <textarea 
                    required
                    rows={5}
                    value={newQuestion.body}
                    onChange={(e) => setNewQuestion(prev => ({ ...prev, body: e.target.value }))}
                    placeholder="Describe your question in detail..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-[#D5B4E7] transition-all resize-none font-medium leading-relaxed"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-[#D5B4E7] hover:bg-[#B697CB] disabled:opacity-50 text-slate-900 rounded-xl font-bold text-lg shadow-lg shadow-[#D5B4E7]/20 transition-all mt-4"
                >
                  {submitting ? 'Posting...' : 'Post Question'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommunityPage;
