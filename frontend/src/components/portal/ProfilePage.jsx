import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Upload, CheckCircle, Camera, Mail, Calendar, Trash2 } from 'lucide-react';

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/portal/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setProfile(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { setError('File must be under 2MB'); return; }
    setError('');
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setSuccess(false);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('profilePic', file);

      const res = await fetch('/api/portal/profile/picture', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');

      // Update state with new user data and current timestamp for cache-busting
      const timestamp = new Date().getTime();
      const updatedUrl = `${data.imageUrl}?t=${timestamp}`;
      
      setProfile(prev => ({ ...prev, profilePic: updatedUrl }));
      setSuccess(true);
      setFile(null);
      setPreview('');

      // Optional: If you use a global Context for user state, update it here too
      // if (updateUser) updateUser(data.user);
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePicture = async () => {
    if (!profile?.profilePic) return;
    if (!window.confirm("Are you sure you want to remove your profile picture?")) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/portal/profile/picture', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Removal failed');

      setProfile(prev => ({ ...prev, profilePic: '' }));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Could not remove profile picture');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const avatarSrc = preview || profile?.profilePic || '';
  const initials = profile?.username?.charAt(0).toUpperCase() || '?';

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 bg-gradient-to-br from-violet-600/10 to-transparent border-violet-500/20">
        <div className="flex items-center gap-3 mb-1">
          <User size={22} className="text-violet-400" />
          <h1 className="text-2xl font-bold text-white">My Profile</h1>
        </div>
        <p className="text-slate-400 text-sm">Manage your profile and profile picture.</p>
      </motion.div>

      {/* Profile Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-8 flex flex-col items-center gap-5">
        {/* Avatar */}
        <div className="relative group">
          <div className="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-violet-600 to-rose-500 flex items-center justify-center text-4xl font-bold text-white border-4 border-slate-700 shadow-xl shadow-violet-500/20">
            {avatarSrc
              ? <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
              : initials
            }
          </div>
          <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <Camera size={22} className="text-white" />
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>
          
          {profile?.profilePic && (
            <button 
              onClick={handleRemovePicture}
              className="absolute -bottom-1 -right-1 bg-rose-500 hover:bg-rose-600 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95"
              title="Remove profile picture"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">{profile?.username}</h2>
          <p className="text-slate-400 text-sm mt-1">{profile?.email}</p>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-6 text-center">
          <div>
            <p className="text-violet-400 font-bold text-xl">{profile?.cybersafetyScore || 0}</p>
            <p className="text-slate-500 text-xs">Score</p>
          </div>
          <div className="w-px h-8 bg-slate-700" />
          <div>
            <p className="text-blue-400 font-bold text-xl">{profile?.lessonsCompleted || 0}</p>
            <p className="text-slate-500 text-xs">Lessons</p>
          </div>
          <div className="w-px h-8 bg-slate-700" />
          <div>
            <p className="text-amber-400 font-bold text-xl">{profile?.badgesEarned?.length || 0}</p>
            <p className="text-slate-500 text-xs">Badges</p>
          </div>
        </div>

        {/* Info */}
        <div className="w-full space-y-3">
          <div className="flex items-center gap-3 bg-slate-800/40 rounded-xl px-4 py-3">
            <Mail size={16} className="text-slate-500 shrink-0" />
            <div>
              <p className="text-slate-500 text-xs">Email</p>
              <p className="text-slate-200 text-sm">{profile?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-slate-800/40 rounded-xl px-4 py-3">
            <Calendar size={16} className="text-slate-500 shrink-0" />
            <div>
              <p className="text-slate-500 text-xs">Member Since</p>
              <p className="text-slate-200 text-sm">{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Upload Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 space-y-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Upload size={16} className="text-violet-400" /> Update Profile Picture
        </h3>
        <label className="flex flex-col items-center gap-3 p-5 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-violet-500/50 transition-colors bg-slate-900/20">
          <Camera size={24} className="text-slate-500" />
          <p className="text-slate-400 text-sm text-center">Click to select a new photo<br /><span className="text-xs text-slate-600">PNG, JPG • Max 2MB</span></p>
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </label>

        <AnimatePresence>
          {preview && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl overflow-hidden border border-slate-700">
              <img src={preview} alt="preview" className="w-full max-h-40 object-cover" />
            </motion.div>
          )}
        </AnimatePresence>

        {error && <p className="text-rose-400 text-sm bg-rose-500/10 rounded-xl px-3 py-2">⚠️ {error}</p>}
        {success && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-emerald-400 text-sm flex items-center gap-2">
            <CheckCircle size={16} /> Profile picture updated successfully!
          </motion.p>
        )}

        {file && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleUpload}
            disabled={uploading}
            className="w-full btn-violet flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Upload size={16} />
            {uploading ? 'Uploading...' : 'Save Profile Picture'}
          </motion.button>
        )}
      </motion.div>

      {/* Badges Section */}
      {profile?.badgesEarned?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">🏅 All Earned Badges</h3>
          <div className="space-y-3">
            {profile.badgesEarned.map((b, i) => (
              <div key={i} className="flex items-center gap-3 bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-3">
                <span className="text-xl">{b.icon}</span>
                <div>
                  <p className="text-white text-sm font-medium">{b.name} Badge</p>
                  <p className="text-slate-500 text-xs">{new Date(b.earnedAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ProfilePage;
