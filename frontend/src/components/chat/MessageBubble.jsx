import { motion } from 'framer-motion';

const MessageBubble = ({ message, isBot }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex w-full mb-4 ${isBot ? 'justify-start' : 'justify-end'}`}
    >
      <div
        className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
          isBot
            ? 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700/50'
            : 'bg-primary-600 text-white rounded-tr-sm shadow-primary-500/20'
        }`}
      >
        {message}
      </div>
    </motion.div>
  );
};

export const TypingIndicator = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className="flex w-full mb-4 justify-start"
  >
    <div className="bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-sm border border-slate-700/50 flex items-center gap-1.5 shadow-sm">
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0 }}
        className="w-1.5 h-1.5 bg-slate-400 rounded-full"
      />
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.2 }}
        className="w-1.5 h-1.5 bg-slate-400 rounded-full"
      />
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.4 }}
        className="w-1.5 h-1.5 bg-slate-400 rounded-full"
      />
    </div>
  </motion.div>
);

export default MessageBubble;
