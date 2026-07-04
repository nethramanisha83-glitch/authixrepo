import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, BookOpen, Brain, Bell, Trophy, Flag, CheckSquare, User,
  LogOut, Shield, Menu, X, ChevronRight, Trash2, MessageSquare
} from 'lucide-react';
import ChatButton from '../chat/ChatButton';
import ChatWindow from '../chat/ChatWindow';

const NAV_LINKS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/learn',     icon: BookOpen,         label: 'Learn' },
  { to: '/quiz',      icon: Brain,             label: 'Quiz' },
  { to: '/community', icon: MessageSquare,     label: 'Community' },
  { to: '/alerts',    icon: Bell,              label: 'Alerts' },
  { to: '/leaderboard', icon: Trophy,          label: 'Leaderboard' },
  { to: '/report',    icon: Flag,              label: 'Report' },
  { to: '/checklist', icon: CheckSquare,       label: 'Checklist' },
  { to: '/profile',   icon: User,              label: 'Profile' },
];

// AI chat only on these routes
const CHAT_ROUTES = ['/dashboard', '/learn'];

const PortalLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const showChat = CHAT_ROUTES.some(r => location.pathname === r || location.pathname.startsWith(r + '/'));

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    // Fetch minimal user info for header
    fetch('/api/portal/profile', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setUserData(d))
      .catch(() => {});
    // Fetch unread alert count
    fetch('/api/portal/alerts', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(alerts => {
        if (Array.isArray(alerts)) {
          setUnreadCount(alerts.filter(a => !a.isRead).length);
        }
      })
      .catch(() => {});
  }, [navigate, location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/profile', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        alert("Account deleted successfully.");
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        const error = await res.json();
        alert(`Error: ${error.message || 'Could not delete account'}`);
      }
    } catch (err) {
      alert("An error occurred while deleting your account.");
    }
  };

  const SidebarContent = ({ mobile = false }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3 border-b border-slate-700/50">
        <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
          <Shield size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-white font-bold text-base leading-tight">CyberSafe</h1>
          <p className="text-violet-400 text-xs font-medium">Campus</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV_LINKS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => mobile && setSidebarOpen(false)}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
            {to === '/alerts' && unreadCount > 0 && (
              <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="p-4 border-t border-slate-700/50 space-y-2">
        {userData && (
          <div className="flex items-center gap-3 px-2 mb-2">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-violet-600 to-rose-500 flex items-center justify-center text-sm font-bold text-white shrink-0">
              {userData.profilePic
                ? <img src={userData.profilePic} alt="avatar" className="w-full h-full object-cover" />
                : userData.username?.charAt(0).toUpperCase()
              }
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{userData.username}</p>
              <p className="text-slate-500 text-xs truncate">{userData.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all duration-200 text-sm font-medium"
        >
          <LogOut size={16} /> Sign Out
        </button>
        <button
          onClick={handleDeleteAccount}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-rose-500/70 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all duration-200 text-sm font-medium"
        >
          <Trash2 size={16} /> Delete Account
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-950 relative overflow-hidden">
      {/* Background blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 -left-40 w-96 h-96 bg-violet-700 rounded-full mix-blend-multiply filter blur-[128px] opacity-10 animate-blob" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-rose-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-10 animate-blob animation-delay-2000" />
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900/90 backdrop-blur-xl border-r border-slate-700/50 fixed left-0 top-0 h-full z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 h-full w-72 bg-slate-900 border-r border-slate-700/50 z-50 lg:hidden flex flex-col"
            >
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
              >
                <X size={20} />
              </button>
              <SidebarContent mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 px-4 sm:px-6 py-4 flex items-center justify-between">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-400 hover:text-white p-1 mr-3"
          >
            <Menu size={22} />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Shield size={16} className="text-violet-400" />
            <ChevronRight size={14} />
            <span className="text-slate-300 font-medium capitalize">
              {location.pathname.replace('/', '') || 'dashboard'}
            </span>
          </div>

          {/* Right: bell + avatar */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Bell */}
            <NavLink to="/alerts" className="relative text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </NavLink>
            {/* Avatar */}
            <NavLink to="/profile">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-violet-600 to-rose-500 flex items-center justify-center text-white font-bold text-sm border-2 border-slate-700 hover:border-violet-500 transition-colors">
                {userData?.profilePic
                  ? <img src={userData.profilePic} alt="avatar" className="w-full h-full object-cover" />
                  : userData?.username?.charAt(0).toUpperCase()
                }
              </div>
            </NavLink>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* AI Chat (only on dashboard + learn) */}
      {showChat && (
        <>
          <ChatWindow isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
          <ChatButton isOpen={isChatOpen} onClick={() => setIsChatOpen(!isChatOpen)} />
        </>
      )}
    </div>
  );
};

export default PortalLayout;
