import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Filter, CheckCheck, AlertTriangle } from 'lucide-react';

const SEVERITY_STYLES = {
  Low:      'severity-low',
  Medium:   'severity-medium',
  Critical: 'severity-critical',
};

const AlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [markingId, setMarkingId] = useState(null);

  const fetchAlerts = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/portal/alerts', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (Array.isArray(data)) {
      setAlerts(data);
      // Browser push notification for unread criticals
      const criticalUnread = data.filter(a => a.severity === 'Critical' && !a.isRead);
      if (criticalUnread.length > 0 && 'Notification' in window) {
        Notification.requestPermission().then(perm => {
          if (perm === 'granted') {
            criticalUnread.slice(0, 3).forEach(a => {
              new Notification(`🚨 Critical Threat: ${a.threatName}`, {
                body: a.description.substring(0, 100) + '...',
                icon: '/shield.svg',
              });
            });
          }
        });
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchAlerts(); }, []);

  const handleMarkRead = async (id) => {
    setMarkingId(id);
    const token = localStorage.getItem('token');
    await fetch(`/api/portal/alerts/${id}/read`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
    });
    setAlerts(prev => prev.map(a => a._id === id ? { ...a, isRead: true } : a));
    setMarkingId(null);
  };

  const categories = ['All', ...Array.from(new Set(alerts.map(a => a.category)))];
  const filtered = filter === 'All' ? alerts : alerts.filter(a => a.category === filter);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 bg-gradient-to-br from-rose-600/10 to-transparent border-rose-500/20">
        <div className="flex items-center gap-3 mb-1">
          <Bell size={22} className="text-rose-400" />
          <h1 className="text-2xl font-bold text-white">Security Alerts</h1>
        </div>
        <p className="text-slate-400 text-sm">{alerts.filter(a => !a.isRead).length} unread alerts</p>
      </motion.div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={16} className="text-slate-400" />
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${
              filter === c
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Alert Cards */}
      <div className="space-y-4">
        <AnimatePresence>
          {filtered.map((alert, i) => (
            <motion.div
              key={alert._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              className={`glass-card p-5 transition-all ${
                alert.severity === 'Critical' ? 'animate-critical-glow border-rose-500/40' : ''
              } ${alert.isRead ? 'opacity-60' : ''}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`mt-1 flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full w-fit shrink-0 ${SEVERITY_STYLES[alert.severity] || 'severity-low'}`}>
                    {alert.severity === 'Critical' && <AlertTriangle size={11} />}
                    {alert.severity}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-white font-semibold text-base mb-1">{alert.threatName}</h3>
                    <p className="text-slate-400 text-xs mb-2">{alert.category}</p>
                    <p className="text-slate-300 text-sm leading-relaxed mb-3">{alert.description}</p>
                    <div className="bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-700/40">
                      <p className="text-emerald-400 text-xs font-medium">✅ Recommended Action:</p>
                      <p className="text-slate-300 text-xs mt-1">{alert.action}</p>
                    </div>
                  </div>
                </div>
                <div className="shrink-0">
                  {!alert.isRead ? (
                    <button
                      onClick={() => handleMarkRead(alert._id)}
                      disabled={markingId === alert._id}
                      className="flex items-center gap-1.5 text-xs bg-violet-600/20 hover:bg-violet-600/40 border border-violet-500/30 text-violet-400 px-3 py-2 rounded-xl transition-all disabled:opacity-50"
                    >
                      <CheckCheck size={14} />
                      {markingId === alert._id ? 'Marking...' : 'Mark Read'}
                    </button>
                  ) : (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <CheckCheck size={13} /> Read
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-8">No alerts in this category.</p>
        )}
      </div>
    </div>
  );
};

export default AlertsPage;
