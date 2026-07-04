import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, Upload, CheckCircle, X } from 'lucide-react';

const THREAT_TYPES = [
  'Phishing Email',
  'Suspicious Link',
  'Social Engineering',
  'Malware / Virus',
  'Ransomware',
  'Identity Theft',
  'Cyberbullying',
  'Data Breach',
  'Other',
];

const ReportPage = () => {
  const [threatType, setThreatType] = useState('');
  const [description, setDescription] = useState('');
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Screenshot must be under 2MB');
      return;
    }
    setError('');
    setScreenshotFile(file);
    setScreenshotPreview(URL.createObjectURL(file));
  };

  const uploadToCloudinary = async (file) => {
    const token = localStorage.getItem('token');
    // Get signed upload params from backend
    const sigRes = await fetch('/api/portal/upload-signature', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const { signature, timestamp, folder, cloud_name, api_key } = await sigRes.json();

    const formData = new FormData();
    formData.append('file', file);
    formData.append('signature', signature);
    formData.append('timestamp', timestamp);
    formData.append('folder', folder);
    formData.append('api_key', api_key);

    const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`, {
      method: 'POST',
      body: formData,
    });
    const data = await uploadRes.json();
    return data.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!threatType || !description.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    setError('');
    setSubmitting(true);

    let screenshotUrl = '';
    try {
      if (screenshotFile) {
        setUploading(true);
        screenshotUrl = await uploadToCloudinary(screenshotFile);
        setUploading(false);
      }
    } catch {
      setUploading(false);
      setError('Screenshot upload failed. Submitting without screenshot...');
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/portal/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ threatType, description, screenshotUrl }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
    } catch {
      setError('Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md mx-auto glass-card p-10 text-center space-y-4"
    >
      <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
        <CheckCircle size={32} className="text-emerald-400" />
      </div>
      <h2 className="text-xl font-bold text-white">Report Submitted!</h2>
      <p className="text-slate-400 text-sm">Thank you for helping keep CyberSafe Campus safe. Our team will review your report.</p>
      <button
        onClick={() => { setSubmitted(false); setThreatType(''); setDescription(''); setScreenshotFile(null); setScreenshotPreview(''); }}
        className="btn-violet w-auto px-6 mx-auto block"
      >
        Submit Another
      </button>
    </motion.div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 bg-gradient-to-br from-orange-600/10 to-transparent border-orange-500/20">
        <div className="flex items-center gap-3 mb-1">
          <Flag size={22} className="text-orange-400" />
          <h1 className="text-2xl font-bold text-white">Report a Threat</h1>
        </div>
        <p className="text-slate-400 text-sm">Spotted something suspicious? Report it to help protect your campus community.</p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmit}
        className="glass-card p-6 space-y-5"
      >
        {/* Threat Type */}
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">Threat Type <span className="text-rose-400">*</span></label>
          <select
            value={threatType}
            onChange={e => setThreatType(e.target.value)}
            className="input-field bg-slate-900/60"
            required
          >
            <option value="">Select a threat type...</option>
            {THREAT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">Description <span className="text-rose-400">*</span></label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe the threat in detail. What happened? How did you discover it? What links or messages were involved?"
            rows={5}
            className="input-field resize-none"
            required
          />
        </div>

        {/* Screenshot */}
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">Screenshot (optional, max 2MB)</label>
          <div className="relative">
            <label className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-violet-500/50 transition-colors bg-slate-900/30">
              <Upload size={24} className="text-slate-500" />
              <p className="text-slate-400 text-sm text-center">
                Click to upload screenshot<br />
                <span className="text-slate-600 text-xs">PNG, JPG up to 2MB</span>
              </p>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          </div>
          <AnimatePresence>
            {screenshotPreview && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative mt-3 rounded-xl overflow-hidden border border-slate-700">
                <img src={screenshotPreview} alt="preview" className="w-full max-h-48 object-cover" />
                <button
                  type="button"
                  onClick={() => { setScreenshotFile(null); setScreenshotPreview(''); }}
                  className="absolute top-2 right-2 bg-rose-500/80 text-white rounded-full p-1"
                >
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {error && <p className="text-rose-400 text-sm bg-rose-500/10 rounded-xl px-4 py-3 border border-rose-500/20">⚠️ {error}</p>}

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={submitting}
          className="w-full btn-violet flex items-center justify-center gap-2 py-3 text-base disabled:opacity-50"
        >
          <Flag size={18} />
          {uploading ? 'Uploading screenshot...' : submitting ? 'Submitting...' : 'Submit Report'}
        </motion.button>
      </motion.form>
    </div>
  );
};

export default ReportPage;
