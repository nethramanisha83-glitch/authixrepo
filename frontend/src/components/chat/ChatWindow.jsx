import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, Trash2 } from 'lucide-react';
import GlareHover from '../ui/GlareHover';
import MessageBubble, { TypingIndicator } from './MessageBubble';

const INITIAL_MESSAGES = [
  { id: 1, text: "Hi! I'm CyberSafe AI 🛡️ Ask me anything about cybersecurity, phishing, passwords, or staying safe online!", isBot: true },
];

const MAX_HISTORY = 5;

const ChatWindow = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    const newUserMsg = { id: Date.now(), text: userText, isBot: false };
    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const maskedKey = apiKey ? `...${apiKey.slice(-4)}` : "NOT_FOUND";
      console.log(`Frontend VITE_GEMINI_API_KEY loaded: ${maskedKey}`);

      if (!apiKey) throw new Error("VITE_GEMINI_API_KEY is missing in frontend env");

      // Build history for last MAX_HISTORY exchanges
      const recentMessages = messages.slice(-MAX_HISTORY * 2);

      let contents = [];
      for (const m of recentMessages) {
        const role = m.isBot ? 'model' : 'user';
        // Combine adjacent messages of the same role
        if (contents.length > 0 && contents[contents.length - 1].role === role) {
          contents[contents.length - 1].parts[0].text += '\n' + m.text;
        } else {
          contents.push({ role, parts: [{ text: m.text }] });
        }
      }

      // Append the new message
      if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
        contents[contents.length - 1].parts[0].text += '\n' + userText;
      } else {
        contents.push({ role: 'user', parts: [{ text: userText }] });
      }

      // Gemini strictly requires the first message to be 'user'
      if (contents.length > 0 && contents[0].role === 'model') {
        contents.shift();
      }

      const systemPrompt = "You are CyberSafe AI, a friendly cybersecurity assistant for students. You only answer questions related to cybersecurity, online safety, phishing, passwords, threats, and digital privacy. If a student asks something unrelated to cybersecurity, politely redirect them back to cyber safety topics. Keep answers short, simple, and student friendly.";

      const finalUserMessage = systemPrompt + "\n\n" + userText;
      
      // Update the last part of contents to include the system prompt
      if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
        contents[contents.length - 1].parts[0].text = systemPrompt + "\n\n" + contents[contents.length - 1].parts[0].text;
      } else {
        contents.push({ role: 'user', parts: [{ text: finalUserMessage }] });
      }

      let attempt = 0;
      let res;
      while (attempt <= 1) { // 1 retry
        res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            generationConfig: { maxOutputTokens: 1000, temperature: 0.7 }
          }),
        });

        if (res.ok) break;

        if (res.status === 429 && attempt < 1) {
          console.warn("Gemini 429 Rate Limit hit. Retrying in 52 seconds...");
          setIsTyping(true); // Keep typing indicator visible
          await new Promise(resolve => setTimeout(resolve, 52000));
          attempt++;
          continue;
        }

        const errText = await res.text();
        throw new Error(`Gemini API Error: ${res.status} ${errText}`);
      }

      const data = await res.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, text: reply || 'Sorry, I could not respond right now. Please try again.', isBot: true },
      ]);
    } catch (error) {
      console.error("AI Chat Error:", error);
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, text: `API Error: ${error.message}. Please check VITE_GEMINI_API_KEY.`, isBot: true },
      ]);
    }
  };

  const handleClear = () => {
    setMessages(INITIAL_MESSAGES);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-24 right-6 sm:right-8 z-50 origin-bottom-right"
        >
          <GlareHover
            width="350px"
            height="500px"
            background="rgba(15, 23, 42, 0.92)"
            borderRadius="1rem"
            borderColor="rgba(139, 92, 246, 0.3)"
            glareOpacity={0.1}
            glareColor="#a78bfa"
            className="backdrop-blur-xl shadow-2xl shadow-violet-500/20"
          >
            <div className="w-full h-full flex flex-col overflow-hidden relative z-20">
              {/* Header */}
              <div className="w-full shrink-0 flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-900/50 relative z-20">
                <div className="flex items-center gap-2 text-white">
                  <div className="w-8 h-8 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center">
                    <Bot size={18} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">CyberSafe AI</h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-green-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Online
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleClear}
                    title="Clear chat"
                    className="text-slate-400 hover:text-violet-400 transition-colors p-1.5 rounded-md hover:bg-slate-800"
                  >
                    <Trash2 size={15} />
                  </button>
                  <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-md hover:bg-slate-800"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="w-full flex-1 overflow-y-auto p-4 flex flex-col scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {messages.map(msg => (
                  <MessageBubble key={msg.id} message={msg.text} isBot={msg.isBot} />
                ))}
                <AnimatePresence>{isTyping && <TypingIndicator />}</AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="w-full shrink-0 p-3 border-t border-slate-700/50 bg-slate-900/90 relative z-20">
                <form onSubmit={handleSend} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    placeholder="Ask about cybersecurity..."
                    className="flex-1 bg-slate-800 text-slate-200 rounded-full px-4 py-2.5 text-sm border border-slate-700 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all font-sans"
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isTyping}
                    className="w-10 h-10 rounded-full bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send size={16} className="ml-0.5" />
                  </button>
                </form>
              </div>
            </div>
          </GlareHover>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatWindow;
