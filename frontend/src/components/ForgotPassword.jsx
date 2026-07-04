import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: null, message: '' }); // type: 'error' | 'success'
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setStatus({ type: 'error', message: 'Please enter your email address' });
      return;
    }

    setIsLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStatus({ type: 'success', message: 'OTP sent! Check your email.' });
        setTimeout(() => {
          // Pass email to reset password page via state
          navigate('/reset-password', { state: { email } });
        }, 2000);
      } else {
        setStatus({ type: 'error', message: data.message });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Connection refused. Server may be offline.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="glass-panel rounded-2xl p-8 w-full relative z-10"
    >
      <div className="mb-6">
        <Link to="/login" className="inline-flex items-center text-slate-400 hover:text-white transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Link>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Forgot Password</h2>
        <p className="text-slate-400">Enter your email to receive an OTP</p>
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
            <AlertCircle className="w-5 h-5 mr-3 mt-0.5 shrink-0" />
            <p className="leading-relaxed">{status.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setStatus({ type: null, message: '' }); }}
              className="input-field pl-10"
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isLoading || status.type === 'success'}
          className="btn-primary flex justify-center items-center"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send OTP'}
        </button>
      </form>
    </motion.div>
  );
};

export default ForgotPassword;
