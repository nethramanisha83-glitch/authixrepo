import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Clock, CheckCircle, XCircle, Trophy, RefreshCw, ChevronRight } from 'lucide-react';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const TIMER_SEC = 30;

const getGrade = (pct) => {
  if (pct >= 80) return { grade: 'A – Expert', badge: '🏆', color: '#8b5cf6' };
  if (pct >= 60) return { grade: 'B – Intermediate', badge: '🥈', color: '#3b82f6' };
  if (pct >= 40) return { grade: 'C – Beginner', badge: '🛡️', color: '#f59e0b' };
  return { grade: 'D – Keep Practicing', badge: '📚', color: '#ef4444' };
};

// Parse QuizAPI answers into an array of { text, correct }
const parseAnswers = (q) => {
  let list = [];
  
  // Handle modern Array format
  if (Array.isArray(q.answers)) {
    list = q.answers.map((ans, idx) => ({
      key: ans.id || `ans_${idx}`,
      text: ans.text,
      correct: ans.isCorrect === true
    }));
  } else {
    // Handle standard Object format
    const answers = q.answers || {};
    const correct = q.correct_answers || {};
    list = Object.entries(answers)
      .filter(([, v]) => v !== null)
      .map(([k, v]) => ({
        key: k,
        text: v,
        correct: String(correct[`${k}_correct`]).toLowerCase() === 'true',
      }));
  }

  // Shuffle the answers so the correct one isn't always at the same position
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }

  return list;
};

const QuizPage = () => {
  const [phase, setPhase] = useState('select'); // select | loading | quiz | summary
  const [difficulty, setDifficulty] = useState('Easy');
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]); // {correct: bool}
  const [timeLeft, setTimeLeft] = useState(TIMER_SEC);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong'
  const timerRef = useRef(null);

  const handleTimeout = useCallback(() => {
    if (selected !== null) return;
    setFeedback('wrong');
    setAnswers(prev => [...prev, { correct: false }]);
    setTimeout(() => {
      setFeedback(null);
      setSelected(null);
      if (currentIdx + 1 >= questions.length && questions.length > 0) {
        setPhase('summary');
        saveResult(score, questions.length);
      } else if (questions.length > 0) {
        setCurrentIdx(i => i + 1);
        setTimeLeft(TIMER_SEC);
      }
    }, 1500);
  }, [selected, currentIdx, questions.length, score]);

  useEffect(() => {
    if (phase !== 'quiz') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, currentIdx, handleTimeout]);

  const startQuiz = async () => {
    setPhase('loading');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/portal/quiz?difficulty=${difficulty}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const parsed = (Array.isArray(data) ? data : []).slice(0, 10);
      
      if (parsed.length === 0) {
        setPhase('select');
        alert('No questions were found for this difficulty. Please try another or check the backend API.');
        return;
      }

      setQuestions(parsed);
      setCurrentIdx(0);
      setScore(0);
      setAnswers([]);
      setTimeLeft(TIMER_SEC);
      setSelected(null);
      setPhase('quiz');
    } catch {
      setPhase('select');
      alert('Failed to fetch quiz questions. Check your QuizAPI key.');
    }
  };

  const handleAnswer = (ans) => {
    if (selected !== null) return;
    clearInterval(timerRef.current);
    setSelected(ans.key);
    const correct = ans.correct;
    if (correct) {
      setScore(s => s + 1);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
    }
    setAnswers(prev => [...prev, { correct }]);
    setTimeout(() => {
      setFeedback(null);
      setSelected(null);
      if (currentIdx + 1 >= questions.length) {
        setPhase('summary');
        saveResult(correct ? score + 1 : score, questions.length);
      } else {
        setCurrentIdx(i => i + 1);
        setTimeLeft(TIMER_SEC);
      }
    }, 1500);
  };

  const saveResult = async (finalScore, total) => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/portal/quiz/result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ score: finalScore, totalQuestions: total, difficulty, category: 'cybersecurity' }),
      });
    } catch {
      // silent
    }
  };

  const resetQuiz = () => {
    setPhase('select');
    setDifficulty('Easy');
    setQuestions([]);
    setCurrentIdx(0);
    setScore(0);
    setAnswers([]);
  };

  if (phase === 'select') return (
    <div className="max-w-lg mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 bg-gradient-to-br from-blue-600/10 to-transparent border-blue-500/20">
        <div className="flex items-center gap-3 mb-2">
          <Brain size={22} className="text-blue-400" />
          <h1 className="text-2xl font-bold text-white">Cyber Quiz</h1>
        </div>
        <p className="text-slate-400 text-sm">Test your cybersecurity knowledge! 10 questions, 30 seconds each.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card p-6 space-y-5">
        <div>
          <p className="text-slate-300 font-medium mb-3">Select Difficulty</p>
          <div className="grid grid-cols-3 gap-3">
            {DIFFICULTIES.map(d => {
              const colors = { Easy: 'emerald', Medium: 'amber', Hard: 'rose' };
              const c = colors[d];
              return (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                    difficulty === d
                      ? `bg-${c}-500/20 border-${c}-500/60 text-${c}-400`
                      : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {d === 'Easy' ? '🟢' : d === 'Medium' ? '🟡' : '🔴'} {d}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-3 text-slate-400 text-sm bg-slate-800/30 rounded-xl p-4">
          <Clock size={16} className="text-blue-400" />
          <span>30 seconds per question • 10 questions total</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={startQuiz}
          className="w-full btn-violet flex items-center justify-center gap-2 text-base py-3"
        >
          Start Quiz <ChevronRight size={18} />
        </motion.button>
      </motion.div>
    </div>
  );

  if (phase === 'loading') return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400 text-sm">Loading questions...</p>
    </div>
  );

  if (phase === 'summary') {
    const pct = Math.round((score / (questions.length || 10)) * 100);
    const { grade, badge, color } = getGrade(pct);
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto glass-card p-8 text-center space-y-6"
      >
        <div className="text-6xl">{badge}</div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Quiz Complete!</h2>
          <p className="text-slate-400 text-sm">{difficulty} • Cybersecurity</p>
        </div>
        <div className="text-7xl font-bold" style={{ color }}>{pct}%</div>
        <div className="text-lg font-semibold" style={{ color }}>{grade}</div>
        <div className="flex justify-center gap-8 text-sm">
          <div>
            <p className="text-emerald-400 font-bold text-2xl">{score}</p>
            <p className="text-slate-500">Correct</p>
          </div>
          <div>
            <p className="text-rose-400 font-bold text-2xl">{questions.length - score}</p>
            <p className="text-slate-500">Wrong</p>
          </div>
        </div>
        <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-3">
          <p className="text-violet-400 text-sm">🏅 Badge awarded: <strong>{pct >= 80 ? 'Expert' : pct >= 50 ? 'Intermediate' : 'Beginner'}</strong></p>
        </div>
        <button onClick={resetQuiz} className="btn-violet flex items-center justify-center gap-2 w-full">
          <RefreshCw size={16} /> Try Again
        </button>
      </motion.div>
    );
  }

  // Quiz phase
  if (phase === 'quiz' && questions.length === 0) {
    return <div className="text-center text-slate-400 p-8 glass-card">No questions available. Please restart.</div>;
  }
  
  const q = questions[currentIdx];
  if (!q) return null;
  const answerOptions = parseAnswers(q);
  const timerPct = (timeLeft / TIMER_SEC) * 100;
  const timerColor = timeLeft > 15 ? '#8b5cf6' : timeLeft > 8 ? '#f59e0b' : '#ef4444';

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-slate-400 mb-1">
        <span>Question {currentIdx + 1} of {questions.length}</span>
        <span className="text-violet-400 font-medium">Score: {score}</span>
      </div>
      <div className="progress-bar-bg h-2">
        <div className="progress-bar-fill h-full" style={{ width: `${((currentIdx) / questions.length) * 100}%` }} />
      </div>

      {/* Timer */}
      <div className="flex items-center gap-3">
        <Clock size={16} style={{ color: timerColor }} />
        <div className="flex-1 bg-slate-700/40 rounded-full h-2.5 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ width: `${timerPct}%`, backgroundColor: timerColor }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <span className="text-sm font-bold w-8 text-right" style={{ color: timerColor }}>{timeLeft}s</span>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
          className="glass-card p-6 space-y-5"
        >
          <p className="text-white font-semibold text-base leading-relaxed">{q.question}</p>

          {/* Answers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {answerOptions.map((ans) => {
              let bg = 'bg-slate-800/50 border-slate-700 hover:border-violet-500/50 text-slate-200';
              if (selected !== null) {
                if (ans.correct) bg = 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300';
                else if (ans.key === selected && !ans.correct) bg = 'bg-rose-500/20 border-rose-500/60 text-rose-300';
                else bg = 'bg-slate-800/30 border-slate-700/50 text-slate-500';
              }
              return (
                <button
                  key={ans.key}
                  onClick={() => handleAnswer(ans)}
                  disabled={selected !== null}
                  className={`p-4 rounded-xl border text-sm text-left flex items-center gap-2 transition-all duration-200 ${bg}`}
                >
                  {selected !== null && ans.correct && <CheckCircle size={16} className="text-emerald-400 shrink-0" />}
                  {selected !== null && ans.key === selected && !ans.correct && <XCircle size={16} className="text-rose-400 shrink-0" />}
                  {ans.text}
                </button>
              );
            })}
          </div>

          {/* Feedback */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl ${
                  feedback === 'correct'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                {feedback === 'correct' ? <><CheckCircle size={16} /> Correct! Well done! 🎉</> : <><XCircle size={16} /> Incorrect. Keep learning!</>}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default QuizPage;
