import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, User, Clock, ShieldCheck, Activity, MapPin, Monitor, AlertCircle } from 'lucide-react';
import ChatButton from './chat/ChatButton';
import ChatWindow from './chat/ChatWindow';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        const [userRes, logsRes] = await Promise.all([
          fetch('/api/dashboard', { headers }),
          fetch('/api/login-logs', { headers })
        ]);

        if (userRes.ok && logsRes.ok) {
          const userData = await userRes.json();
          const logsData = await logsRes.json();
          setUser(userData);
          setLogs(logsData);
        } else {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10 w-full max-w-4xl mx-auto -ml-36 md:-ml-0">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto z-10 relative md:-mx-24 lg:-mx-48"
    >
      {/* Header */}
      <div className="glass-panel rounded-2xl p-6 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4 text-white">
          <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">Welcome, {user?.username}</h1>
            <p className="text-slate-400 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-500" /> Account Secure
            </p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2.5 rounded-lg border border-slate-700 flex items-center gap-2 transition-all font-medium whitespace-nowrap"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Account Info Card */}
        <div className="glass-panel rounded-2xl p-6 col-span-1 border-t-4 border-t-primary-500">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-primary-400" /> Account Details
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-slate-500 text-sm mb-1">Email Address</p>
              <p className="text-slate-200 font-medium break-all">{user?.email}</p>
            </div>
            <div>
              <p className="text-slate-500 text-sm mb-1">Member Since</p>
              <p className="text-slate-200 font-medium">
                {new Date(user?.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-sm mb-1">Status</p>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Active
              </span>
            </div>
          </div>
        </div>

        {/* Activity Logs */}
        <div className="glass-panel rounded-2xl p-6 col-span-1 md:col-span-2 border-t-4 border-t-purple-500">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" /> Recent Activity
            </h3>
            <span className="text-xs font-medium bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700">
              Last 5 Logins
            </span>
          </div>

          <div className="space-y-4">
            {logs.length === 0 ? (
              <p className="text-slate-400 text-center py-4">No recent activity found.</p>
            ) : (
              logs.map((log, index) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  key={log._id || index} 
                  className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800 transition-colors flex flex-col sm:flex-row justify-between sm:items-center gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${log.loginStatus === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                      {log.loginStatus === 'success' ? <ShieldCheck className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-white font-medium capitalize flex items-center gap-2">
                        {log.loginStatus} Login
                        <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider ${log.loginStatus === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {log.loginStatus}
                        </span>
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {log.ipAddress}</span>
                        <span className="flex items-center gap-1"><Monitor className="w-3 h-3" /> {log.browser.split(' ')[0]}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1 sm:justify-end">
                    <Clock className="w-3 h-3" />
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* AI Chatbot Widget */}
      <ChatWindow isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <ChatButton isOpen={isChatOpen} onClick={() => setIsChatOpen(!isChatOpen)} />
    </motion.div>
  );
};

export default Dashboard;
