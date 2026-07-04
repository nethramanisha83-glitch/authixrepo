import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/common/ProtectedRoute';
import Signup from './components/Signup';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import PortalLayout from './components/portal/PortalLayout';
import DashboardPage from './components/portal/DashboardPage';
import LearnPage from './components/portal/LearnPage';
import QuizPage from './components/portal/QuizPage';
import AlertsPage from './components/portal/AlertsPage';
import CommunityPage from './components/portal/CommunityPage';
import LeaderboardPage from './components/portal/LeaderboardPage';
import ReportPage from './components/portal/ReportPage';
import ChecklistPage from './components/portal/ChecklistPage';
import ProfilePage from './components/portal/ProfilePage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth routes – keep existing animated background layout */}
        <Route
          path="/"
          element={
            <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-slate-950" />
                <div className="absolute top-0 -left-4 w-72 h-72 bg-primary-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob" />
                <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-2000" />
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-4000" />
              </div>
              <div className="relative z-10 w-full max-w-md p-6">
                <Navigate to="/login" replace />
              </div>
            </div>
          }
        />

        {['signup', 'login', 'forgot-password', 'reset-password'].map(path => (
          <Route
            key={path}
            path={`/${path}`}
            element={
              <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                  <div className="absolute inset-0 bg-slate-950" />
                  <div className="absolute top-0 -left-4 w-72 h-72 bg-primary-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob" />
                  <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-2000" />
                  <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-4000" />
                </div>
                <div className="relative z-10 w-full max-w-md p-6">
                  {path === 'signup' && <Signup />}
                  {path === 'login' && <Login />}
                  {path === 'forgot-password' && <ForgotPassword />}
                  {path === 'reset-password' && <ResetPassword />}
                </div>
              </div>
            }
          />
        ))}

        {/* Portal routes – all wrapped in PortalLayout with sidebar */}
        <Route element={<ProtectedRoute />}>
          <Route element={<PortalLayout />}>
            <Route path="/dashboard"   element={<DashboardPage />} />
            <Route path="/learn"       element={<LearnPage />} />
            <Route path="/quiz"        element={<QuizPage />} />
            <Route path="/community"   element={<CommunityPage />} />
            <Route path="/alerts"      element={<AlertsPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/report"      element={<ReportPage />} />
            <Route path="/checklist"   element={<ChecklistPage />} />
            <Route path="/profile"     element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
