import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, KeyRound, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = location.state?.email || '';

  const [step, setStep] = useState(1); // 1: Verify OTP, 2: New Password
  const [formData, setFormData] = useState({
    email: initialEmail,
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [status, setStatus] = useState({ type: null, message: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!initialEmail) {
      // If no email in state, user didn't come from ForgotPassword
      navigate('/forgot-password');
    }
  }, [initialEmail, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setStatus({ type: null, message: '' });
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!formData.otp || formData.otp.length !== 6) {
      setStatus({ type: 'error', message: 'Please enter a valid 6-digit OTP' });
      return;
    }

    setIsLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp: formData.otp })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStatus({ type: 'success', message: 'OTP Verified. You can now reset your password.' });
        setTimeout(() => {
          setStep(2);
          setStatus({ type: null, message: '' });
        }, 1500);
      } else {
        setStatus({ type: 'error', message: data.message });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Network error.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!formData.newPassword || formData.newPassword !== formData.confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match or are empty' });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          otp: formData.otp, // send OTP again for final verification
          newPassword: formData.newPassword
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStatus({ type: 'success', message: 'Password reset successfully!' });
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setStatus({ type: 'error', message: data.message });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Network error.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel rounded-2xl p-8 w-full relative z-10"
    >
      <div className="text-center mb-8">
        <div className="mx-auto w-12 h-12 bg-primary-500/20 text-primary-500 rounded-full flex items-center justify-center mb-4">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">
          {step === 1 ? 'Verify OTP' : 'New Password'}
        </h2>
        <p className="text-slate-400">
          {step === 1 ? `Sent to ${formData.email}` : 'Create a strong, secure password'}
        </p>
      </div>

      <AnimatePresence>
        {status.type && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`border rounded-lg p-3 mb-6 flex items-start text-sm ${
              status.type === 'error' 
                ? 'bg-red-500/10 border-red-500/50 text-red-500' 
                : 'bg-green-500/10 border-green-500/50 text-green-500'
            }`}
          >
            {status.type === 'error' ? <AlertCircle className="w-5 h-5 mr-3 mt-0.5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 mr-3 mt-0.5 shrink-0" />}
            <p className="leading-relaxed">{status.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {step === 1 ? (
        <form onSubmit={handleVerifyOTP} className="space-y-6">
          <div>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="text"
                name="otp"
                placeholder="Enter 6-digit OTP"
                value={formData.otp}
                onChange={handleChange}
                maxLength={6}
                className="input-field pl-10 text-center tracking-[0.5em] text-lg font-mono"
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={isLoading || status.type === 'success'}
            className="btn-primary flex justify-center items-center"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Code'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-6">
          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="password"
                name="newPassword"
                placeholder="New Password"
                value={formData.newPassword}
                onChange={handleChange}
                className="input-field pl-10"
              />
            </div>
          </div>
          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm New Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input-field pl-10"
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={isLoading || status.type === 'success'}
            className="btn-primary flex justify-center items-center"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
          </button>
        </form>
      )}

      <div className="mt-6 text-center text-sm">
        <Link to="/login" className="text-slate-400 hover:text-white transition-colors">
          Return to Login
        </Link>
      </div>
    </motion.div>
  );
};

export default ResetPassword;
