import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState(null); // 'checking', 'available', 'taken'
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: '', color: '' });
  
  // Debounced username check
  useEffect(() => {
    const checkUser = async () => {
      if (formData.username.length < 3) {
        setUsernameStatus(null);
        return;
      }
      setUsernameStatus('checking');
      try {
        const res = await fetch(`/api/check-username?username=${formData.username}`);
        const data = await res.json();
        setUsernameStatus(data.available ? 'available' : 'taken');
        if (!data.available) {
          setErrors(prev => ({ ...prev, username: data.message }));
        } else {
          setErrors(prev => {
            const newErr = { ...prev };
            delete newErr.username;
            return newErr;
          });
        }
      } catch (err) {
        setUsernameStatus(null);
      }
    };

    const timeoutId = setTimeout(checkUser, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.username]);

  const evaluatePassword = (pass) => {
    let score = 0;
    if (!pass) return { score: 0, text: '', color: 'bg-slate-700' };
    
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    let text = 'Weak';
    let color = 'bg-red-500';

    if (score === 4) {
      text = 'Strong';
      color = 'bg-green-500';
    } else if (score >= 2) {
      text = 'Medium';
      color = 'bg-yellow-500';
    }

    return { score, text, color };
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setFormData({ ...formData, password: val });
    setPasswordStrength(evaluatePassword(val));
    
    if (errors.password) {
      setErrors(prev => { const n = {...prev}; delete n.password; return n; });
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: null }));
    }
  };

  const validate = () => {
    let newErrors = {};
    if (!formData.username) newErrors.username = 'Username is required';
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (passwordStrength.score < 4) {
      newErrors.password = 'Password must meet all requirements';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (usernameStatus === 'taken') {
      newErrors.username = 'Username is already taken';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsLoading(true);
    setErrors({ general: null });
    
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Automatically login
        localStorage.setItem('token', data.token);
        navigate('/dashboard');
      } else {
        setErrors({ general: data.message });
      }
    } catch (err) {
      setErrors({ general: 'Server mapping error. Is backend running?' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="glass-panel rounded-2xl p-8 w-full relative z-10"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
        <p className="text-slate-400">Join us to experience modern authentication</p>
      </div>

      <AnimatePresence>
        {errors.general && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-500/10 border border-red-500/50 text-red-500 rounded-lg p-3 mb-6 flex items-center text-sm"
          >
            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
            <p>{errors.general}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Username */}
        <div>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              className={`input-field pl-10 ${errors.username ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
            {usernameStatus === 'checking' && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />}
            {usernameStatus === 'available' && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />}
            {usernameStatus === 'taken' && <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />}
          </div>
          {errors.username && <p className="text-red-500 text-xs mt-1 ml-1">{errors.username}</p>}
        </div>

        {/* Email */}
        <div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
              className={`input-field pl-10 ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
          </div>
          {errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handlePasswordChange}
              className={`input-field pl-10 ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
          </div>
          
          {/* Strength Indicator */}
          <div className="mt-2 text-xs">
            <div className="flex justify-between mb-1">
              <span className="text-slate-400">Password Strength:</span>
              <span className={formData.password ? `text-${passwordStrength.color.split('-')[1]}-500` : 'text-slate-500'}>
                {passwordStrength.text || 'None'}
              </span>
            </div>
            <div className="flex gap-1 h-1.5 w-full">
               {[1, 2, 3, 4].map(step => (
                 <div key={step} className={`flex-1 rounded-full transition-all duration-300 ${passwordStrength.score >= step ? passwordStrength.color : 'bg-slate-700'}`} />
               ))}
            </div>
            <ul className="text-slate-500 grid flex-wrap grid-cols-2 gap-1 mt-2 text-[10px]">
              <li className={formData.password.length >= 8 ? "text-green-500" : ""}>✓ Min 8 chars</li>
              <li className={/[A-Z]/.test(formData.password) ? "text-green-500" : ""}>✓ Uppercase</li>
              <li className={/[0-9]/.test(formData.password) ? "text-green-500" : ""}>✓ Number</li>
              <li className={/[^A-Za-z0-9]/.test(formData.password) ? "text-green-500" : ""}>✓ Special Char</li>
            </ul>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1 ml-1">{errors.password}</p>}
        </div>

        {/* Confirm Password */}
        <div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`input-field pl-10 ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
          </div>
          {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 ml-1">{errors.confirmPassword}</p>}
        </div>

        <button 
          type="submit" 
          disabled={isLoading || usernameStatus === 'checking' || usernameStatus === 'taken'}
          className="btn-primary flex justify-center items-center"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
        </button>

      </form>

      <div className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-500 hover:text-primary-400 font-medium transition-colors">
          Sign In
        </Link>
      </div>
    </motion.div>
  );
};

export default Signup;
