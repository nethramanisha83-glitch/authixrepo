import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';

const MEDAL = ['🥇', '🥈', '🥉'];
const RANK_STYLES = [
  'border-amber-500/60 bg-gradient-to-r from-amber-500/10 to-transparent shadow-amber-500/10',
  'border-slate-400/60 bg-gradient-to-r from-slate-400/10 to-transparent shadow-slate-400/10',
  'border-orange-600/60 bg-gradient-to-r from-orange-600/10 to-transparent shadow-orange-600/10',
];

const LeaderboardPage = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/portal/leaderboard', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setLeaders(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 bg-gradient-to-br from-amber-600/10 to-transparent border-amber-500/20">
        <div className="flex items-center gap-3 mb-1">
          <Trophy size={22} className="text-amber-400" />
          <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
        </div>
        <p className="text-slate-400 text-sm">Top students ranked by cyber safety score</p>
      </motion.div>

      {leaders.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-12">No students ranked yet. Complete quizzes to appear here!</p>
      ) : (
        <div className="space-y-3">
          {leaders.map((u, i) => (
            <motion.div
              key={u._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`glass-card p-4 border flex items-center gap-4 shadow-lg ${i < 3 ? RANK_STYLES[i] : 'border-slate-700/50'}`}
            >
              {/* Rank */}
              <div className="w-10 text-center text-xl shrink-0">
                {i < 3 ? MEDAL[i] : <span className="text-slate-500 font-bold text-sm">#{u.rank}</span>}
              </div>

              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                i === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600 ring-2 ring-amber-400/60' :
                i === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-600 ring-2 ring-slate-400/60' :
                i === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-700 ring-2 ring-orange-500/60' :
                'bg-gradient-to-br from-violet-600 to-violet-800'
              }`}>
                {u.profilePic
                  ? <img src={u.profilePic} alt="avatar" className="w-full h-full object-cover" />
                  : u.username?.charAt(0).toUpperCase()
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">{u.username}</p>
                <p className="text-slate-500 text-xs">{u.badgeCount} badge{u.badgeCount !== 1 ? 's' : ''} • {u.lessonsCompleted} lesson{u.lessonsCompleted !== 1 ? 's' : ''}</p>
              </div>

              {/* Score */}
              <div className="text-right shrink-0">
                <p className={`text-xl font-bold ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-orange-400' : 'text-violet-400'}`}>
                  {u.cybersafetyScore}
                </p>
                <p className="text-slate-500 text-xs">score</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeaderboardPage;
