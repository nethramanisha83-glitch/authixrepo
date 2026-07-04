import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, CircleDashed } from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const ITEMS = [
  { id: 'twofa',         label: 'Enabled two-factor authentication',              emoji: '🔐' },
  { id: 'strongpassword',label: 'Using a strong, unique password',                  emoji: '🔑' },
  { id: 'nowifisensitive',label: 'Avoiding public WiFi for sensitive tasks',         emoji: '📡' },
  { id: 'updated',       label: 'Keeping software and apps updated',               emoji: '🔄' },
  { id: 'nolinks',       label: 'Not clicking unknown links or attachments',        emoji: '🚫' },
  { id: 'vpn',           label: 'Using a VPN on public networks',                  emoji: '🌐' },
  { id: 'logout',        label: 'Logging out after using shared devices',           emoji: '🚪' },
];

const ChecklistPage = () => {
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/portal/checklist', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setCompleted(d.completedItems || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const saveChecklist = async (newCompleted) => {
    setSaving(true);
    const token = localStorage.getItem('token');
    await fetch('/api/portal/checklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ completedItems: newCompleted }),
    }).catch(() => {});
    setSaving(false);
  };

  const toggleItem = (id) => {
    const next = completed.includes(id)
      ? completed.filter(i => i !== id)
      : [...completed, id];
    setCompleted(next);
    saveChecklist(next);
  };

  const pct = ITEMS.length > 0 ? Math.round((completed.length / ITEMS.length) * 100) : 0;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 bg-gradient-to-br from-emerald-600/10 to-transparent border-emerald-500/20">
        <div className="flex items-center gap-3 mb-1">
          <CheckSquare size={22} className="text-emerald-400" />
          <h1 className="text-2xl font-bold text-white">Security Checklist</h1>
        </div>
        <p className="text-slate-400 text-sm">Complete these security habits to protect yourself online.</p>
      </motion.div>

      {/* Progress Ring */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-28 h-28 shrink-0">
          <CircularProgressbar
            value={pct}
            text={`${pct}%`}
            styles={buildStyles({
              textSize: '22px',
              pathColor: '#8b5cf6',
              textColor: '#f1f5f9',
              trailColor: '#1e293b',
              pathTransitionDuration: 1,
            })}
          />
        </div>
        <div>
          <p className="text-white font-bold text-xl">{completed.length} / {ITEMS.length} Items Complete</p>
          <p className="text-slate-400 text-sm mt-1">
            {pct === 100 ? '🎉 You are fully protected! Excellent work!' :
             pct >= 50 ? '💪 Great progress! Keep completing items.' :
             '🛡️ Start checking off items to secure yourself!'}
          </p>
          {saving && <p className="text-violet-400 text-xs mt-2 animate-pulse">Saving...</p>}
        </div>
      </motion.div>

      {/* Checklist Items */}
      <div className="space-y-3">
        {ITEMS.map((item, i) => {
          const done = completed.includes(item.id);
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => toggleItem(item.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-300 ${
                done
                  ? 'bg-violet-500/10 border-violet-500/40 shadow-lg shadow-violet-500/10'
                  : 'glass-card border-slate-700/50 hover:border-violet-500/30'
              }`}
            >
              <span className="text-2xl">{item.emoji}</span>
              <span className={`flex-1 text-sm font-medium ${done ? 'text-violet-300 line-through decoration-violet-400/60' : 'text-slate-200'}`}>
                {item.label}
              </span>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${
                done ? 'bg-violet-500 border-violet-500' : 'border-slate-600'
              }`}>
                {done && (
                  <motion.svg
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    width="12" height="12" viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </motion.svg>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default ChecklistPage;
