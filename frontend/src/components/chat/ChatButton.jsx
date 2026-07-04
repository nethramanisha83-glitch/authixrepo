import { motion } from 'framer-motion';
import { MessageSquareText } from 'lucide-react';
import GlareHover from '../ui/GlareHover';

const ChatButton = ({ onClick, isOpen }) => {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="fixed bottom-6 right-6 sm:right-8 z-50 flex items-center justify-center"
    >
      {/* Pulse effect ring behind the button */}
      {!isOpen && (
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="absolute inset-0 bg-primary-500 rounded-full z-0"
        />
      )}

      {/* Button wrapped in GlareHover */}
      <div onClick={onClick} className="relative z-10">
        <GlareHover
          width="56px"
          height="56px"
          borderRadius="9999px"
          background="linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
          borderColor="rgba(255,255,255,0.2)"
          glareColor="#ffffff"
          glareOpacity={0.35}
          className="shadow-xl shadow-primary-500/30 flex items-center justify-center group"
          playOnce={false}
        >
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0, scale: isOpen ? 0.8 : 1 }}
            transition={{ duration: 0.3 }}
            className="text-white relative z-20 group-hover:scale-110 transition-transform"
          >
            <MessageSquareText size={24} />
          </motion.div>
        </GlareHover>
      </div>
    </motion.div>
  );
};

export default ChatButton;
