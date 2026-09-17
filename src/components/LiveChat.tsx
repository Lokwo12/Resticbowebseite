import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageCircle, X, Send, User, AtSign, Loader, 
  RotateCcw, ExternalLink, Sparkles, CheckCircle2, 
  ChevronRight, Bot, ArrowRight
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';
import { generateBotReply, INITIAL_QUICK_REPLIES, BotReply } from '../utils/chatbotEngine';

interface ChatMessage {
  id?: string;
  sender: 'bot' | 'user' | 'agent';
  text: string;
  timestamp?: string;
  link?: {
    text: string;
    url: string;
  };
  quickReplies?: string[];
}

const DEFAULT_WELCOME_MESSAGE: ChatMessage = {
  sender: 'bot',
  text: "Hello! Welcome to RESTI CBO Kiryandongo. 👋 How can we help you today? Feel free to ask a question or tap a quick topic below.",
  timestamp: new Date().toISOString(),
  quickReplies: INITIAL_QUICK_REPLIES
};

export function LiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('resti_chat_messages_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [DEFAULT_WELCOME_MESSAGE];
  });
  
  const [inputValue, setInputValue] = useState('');
  const [email, setEmail] = useState(() => localStorage.getItem('resti_chat_email') || '');
  const [isCapturingEmail, setIsCapturingEmail] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(() => localStorage.getItem('resti_chat_session') || null);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Save messages to local storage
  useEffect(() => {
    try {
      localStorage.setItem('resti_chat_messages_v2', JSON.stringify(messages));
    } catch (e) {}
  }, [messages]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
      setUnreadCount(0);
      inputRef.current?.focus();
    }
  }, [isOpen, messages, isBotTyping]);

  // Poll for admin replies if session exists and chat is open
  useEffect(() => {
    let intervalId: ReturnType<typeof setTimeout>;

    const pollSession = async () => {
      if (!sessionId || !isOpen) return;
      try {
        const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/livechat/session/${sessionId}`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.session && Array.isArray(data.session.messages)) {
            // Check if there are new agent messages
            const backendMsgs: ChatMessage[] = data.session.messages.map((m: any) => ({
              sender: m.sender,
              text: m.text,
              timestamp: m.timestamp
            }));

            // If backend has more messages or human messages, integrate them
            setMessages(prev => {
              const prevTextSet = new Set(prev.map(p => p.text));
              const newItems = backendMsgs.filter(b => !prevTextSet.has(b.text));
              if (newItems.length > 0) {
                return [...prev, ...newItems];
              }
              return prev;
            });
          }
        }
      } catch (err) {
        // Silent poll error
      }
    };

    if (isOpen && sessionId) {
      intervalId = setInterval(pollSession, 4000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isOpen, sessionId]);

  // Process sending a user message
  const processMessage = async (textToSend: string) => {
    const userText = textToSend.trim();
    if (!userText) return;

    const userMsg: ChatMessage = {
      sender: 'user',
      text: userText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    // Check if user is entering email
    if (isCapturingEmail) {
      if (userText.includes('@') && userText.includes('.')) {
        setEmail(userText);
        try {
          localStorage.setItem('resti_chat_email', userText);
        } catch (e) {}
        setIsCapturingEmail(false);

        setIsBotTyping(true);
        setTimeout(() => {
          setIsBotTyping(false);
          setMessages(prev => [
            ...prev,
            {
              sender: 'bot',
              text: `Thank you! We've saved your contact (${userText}). Our Kiryandongo field coordinator will follow up with you directly. 💚`,
              timestamp: new Date().toISOString(),
              quickReplies: ['📚 View Programs', '💚 Make a Donation', '📍 Our Location']
            }
          ]);
        }, 500);

        // Send to backend contact form
        try {
          fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/contact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
            body: JSON.stringify({
              name: 'Website Chat Visitor',
              email: userText,
              message: `Live chat inquiry from ${userText}. Previous message: ${messages[messages.length - 1]?.text || 'Assistance requested'}`
            })
          });
        } catch (e) {}
        return;
      } else {
        setIsBotTyping(true);
        setTimeout(() => {
          setIsBotTyping(false);
          setMessages(prev => [
            ...prev,
            {
              sender: 'bot',
              text: "Please provide a valid email address (e.g., name@example.com) so our team can follow up with you.",
              timestamp: new Date().toISOString()
            }
          ]);
        }, 400);
        return;
      }
    }

    // Check if user wants to speak with staff
    if (userText.toLowerCase().includes('speak to staff') || userText.toLowerCase().includes('talk to a human') || userText.toLowerCase().includes('message staff')) {
      setIsCapturingEmail(true);
      setIsBotTyping(true);
      setTimeout(() => {
        setIsBotTyping(false);
        setMessages(prev => [
          ...prev,
          {
            sender: 'bot',
            text: "I'd be glad to connect you with our Kiryandongo team! 🙋 Please enter your email address below, and our staff will reply directly to your inquiry.",
            timestamp: new Date().toISOString()
          }
        ]);
      }, 500);
      return;
    }

    // Generate smart Bot Response
    setIsBotTyping(true);
    const botReplyData: BotReply = generateBotReply(userText);

    setTimeout(() => {
      setIsBotTyping(false);
      const newBotMsg: ChatMessage = {
        sender: 'bot',
        text: botReplyData.text,
        timestamp: new Date().toISOString(),
        link: botReplyData.link,
        quickReplies: botReplyData.quickReplies
      };
      setMessages(prev => [...prev, newBotMsg]);
      if (!isOpen) {
        setUnreadCount(c => c + 1);
      }
    }, 600);

    // Sync to backend session
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/livechat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          sessionId: sessionId,
          email: email || '',
          message: userText
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.sessionId && !sessionId) {
          setSessionId(data.sessionId);
          localStorage.setItem('resti_chat_session', data.sessionId);
        }
      }
    } catch (e) {
      // Offline / network fallback is seamlessly handled by bot
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processMessage(inputValue);
  };

  const handleQuickReply = (text: string) => {
    // Strip leading emoji if present for cleaner search
    const cleanText = text.replace(/^[^ws]+s*/, '');
    processMessage(cleanText);
  };

  const handleRestart = () => {
    setMessages([DEFAULT_WELCOME_MESSAGE]);
    setIsCapturingEmail(false);
    setInputValue('');
    try {
      localStorage.removeItem('resti_chat_messages_v2');
      localStorage.removeItem('resti_chat_session');
    } catch (e) {}
    setSessionId(null);
    toast.info('Chat session restarted');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* ── CHAT WINDOW ── */}
      <div 
        className={`absolute bottom-16 right-0 w-[92vw] sm:w-[390px] h-[520px] max-h-[82vh] bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200/90 flex flex-col transition-all duration-300 origin-bottom-right transform ${
          isOpen ? 'scale-100 opacity-100 visible pointer-events-auto' : 'scale-90 opacity-0 invisible pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 p-4 text-white flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white backdrop-blur-md">
                <Bot size={22} />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-emerald-800 rounded-full animate-pulse"></span>
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                <span>RESTI Assistant</span>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Online
                </span>
              </h3>
              <p className="text-[11px] text-emerald-100 opacity-85">Kiryandongo Community Support</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleRestart}
              className="p-1.5 text-white/75 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              title="Restart Conversation"
            >
              <RotateCcw size={16} />
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-white/75 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              title="Close Chat"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-3.5 text-xs">
          {messages.map((msg, idx) => {
            const isUser = msg.sender === 'user';
            const isLastMessage = idx === messages.length - 1;

            return (
              <div key={idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div 
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-xs leading-relaxed whitespace-pre-line ${
                    isUser
                      ? 'bg-emerald-600 text-white rounded-tr-xs'
                      : 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-xs'
                  }`}
                >
                  {msg.text}

                  {/* Interactive Bot Link Button */}
                  {msg.link && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100">
                      <Link
                        to={msg.link.url}
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors border border-emerald-200"
                      >
                        <span>{msg.link.text}</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  )}
                </div>

                {/* Quick Reply Chips on the last message */}
                {!isUser && isLastMessage && msg.quickReplies && msg.quickReplies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5 max-w-[95%]">
                    {msg.quickReplies.map((qr, qIdx) => (
                      <button
                        key={qIdx}
                        type="button"
                        onClick={() => handleQuickReply(qr)}
                        className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-full text-[11px] font-semibold transition-all shadow-2xs hover:scale-[1.02] cursor-pointer"
                      >
                        {qr}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isBotTyping && (
            <div className="flex items-center gap-2 text-slate-500 bg-white border border-slate-200 px-3.5 py-2.5 rounded-2xl rounded-tl-xs w-fit shadow-xs text-xs">
              <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              <span className="ml-1 text-[11px] font-medium text-slate-400">RESTI Assistant is typing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-200/90 flex gap-2 items-center shrink-0">
          <div className="relative flex-1">
            {isCapturingEmail && (
              <AtSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600" />
            )}
            <input
              ref={inputRef}
              type={isCapturingEmail ? 'email' : 'text'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isCapturingEmail ? "Enter your email address..." : "Ask a question about RESTI..."}
              className={`w-full bg-slate-100 border border-transparent focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl py-2.5 pr-4 text-xs sm:text-sm transition-all outline-none text-slate-900 placeholder:text-slate-400 ${
                isCapturingEmail ? 'pl-9' : 'pl-3.5'
              }`}
            />
          </div>

          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center hover:bg-emerald-700 active:scale-95 disabled:opacity-40 disabled:hover:bg-emerald-600 transition-all shrink-0 cursor-pointer shadow-sm"
          >
            <Send size={15} className={inputValue.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
          </button>
        </form>
      </div>

      {/* ── FLOATING TRIGGER BUTTON ── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-14 h-14 bg-gradient-to-tr from-emerald-600 to-teal-600 text-white rounded-full shadow-[0_8px_30px_rgba(5,150,105,0.35)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-300 z-50 group cursor-pointer border-2 border-white/20"
        aria-label="Open Live Chat"
      >
        {isOpen ? (
          <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
        ) : (
          <>
            <MessageCircle size={26} className="group-hover:scale-110 transition-transform duration-300" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                {unreadCount}
              </span>
            )}
          </>
        )}
      </button>
    </div>
  );
}
