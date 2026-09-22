import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageCircle, X, Send, Bot, RotateCcw, ArrowRight, Minus, Sparkles
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';
import { 
  generateBotReply, 
  INITIAL_QUICK_ACTIONS, 
  WELCOME_MESSAGE_TEXT, 
  BotReply 
} from '../utils/chatbotEngine';

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
  text: WELCOME_MESSAGE_TEXT,
  timestamp: new Date().toISOString(),
  quickReplies: INITIAL_QUICK_ACTIONS
};

export function LiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('resti_chat_messages_v3');
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
      localStorage.setItem('resti_chat_messages_v3', JSON.stringify(messages));
    } catch (e) {}
  }, [messages]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(scrollToBottom, 80);
      setUnreadCount(0);
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized, messages, isBotTyping]);

  // Keyboard accessibility: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

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
            const backendMsgs: ChatMessage[] = data.session.messages.map((m: any) => ({
              sender: m.sender,
              text: m.text,
              timestamp: m.timestamp
            }));

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
        // Silent error handling for poll
      }
    };

    if (isOpen && sessionId) {
      intervalId = setInterval(pollSession, 5000);
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

    // Check if user is capturing contact email
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
              text: `Thank you! We have recorded your contact (${userText}). A RESTI field coordinator in Kiryandongo will follow up directly. 💚`,
              timestamp: new Date().toISOString(),
              quickReplies: ['Our Programs', 'Resources', 'Donate', 'Main Menu']
            }
          ]);
        }, 400);

        try {
          fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/contact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
            body: JSON.stringify({
              name: 'Website Chat Visitor',
              email: userText,
              message: `Live chat message from ${userText}. Previous context: ${messages[messages.length - 1]?.text || 'Assistance requested'}`
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
        }, 300);
        return;
      }
    }

    // Check if user explicitly asked for staff
    if (userText.toLowerCase() === 'speak to staff' || userText.toLowerCase().includes('speak with staff')) {
      setIsCapturingEmail(true);
      setIsBotTyping(true);
      setTimeout(() => {
        setIsBotTyping(false);
        setMessages(prev => [
          ...prev,
          {
            sender: 'bot',
            text: "I would be glad to connect you with our team! 🙋 Please enter your email address below, and our staff will reply promptly.",
            timestamp: new Date().toISOString()
          }
        ]);
      }, 400);
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
    }, 450);

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
      // Seamless offline / local fallback
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processMessage(inputValue);
  };

  const handleQuickReply = (text: string) => {
    processMessage(text);
  };

  const handleRestart = () => {
    setMessages([DEFAULT_WELCOME_MESSAGE]);
    setIsCapturingEmail(false);
    setInputValue('');
    try {
      localStorage.removeItem('resti_chat_messages_v3');
      localStorage.removeItem('resti_chat_session');
    } catch (e) {}
    setSessionId(null);
    toast.info('Conversation restarted');
  };

  return (
    <aside aria-label="RESTI Live Chat Support" className="fixed bottom-6 right-6 z-50 font-sans">
      {/* ── CHAT WINDOW ── */}
      <div 
        role="dialog"
        aria-modal="false"
        aria-label="RESTI Assistant Chat Window"
        className={`absolute bottom-16 right-0 w-[94vw] sm:w-[390px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#DCE4DF] flex flex-col transition-all duration-200 origin-bottom-right transform ${
          isOpen && !isMinimized
            ? 'h-[520px] max-h-[82vh] scale-100 opacity-100 visible pointer-events-auto' 
            : isOpen && isMinimized
            ? 'h-14 scale-100 opacity-100 visible pointer-events-auto'
            : 'scale-95 opacity-0 invisible pointer-events-none'
        }`}
      >
        {/* Header */}
        <header className="bg-[#084C24] px-4 py-3 text-white flex items-center justify-between shadow-xs shrink-0 select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white">
              <Bot size={18} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-white">RESTI Assistant</span>
                <span className="w-2 h-2 bg-emerald-400 rounded-full inline-block" title="Online"></span>
              </div>
              <p className="text-[11px] text-emerald-100/80 leading-none">Kiryandongo Community Assistant</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleRestart}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="New Conversation"
              aria-label="New Conversation"
            >
              <RotateCcw size={15} />
            </button>
            <button
              type="button"
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title={isMinimized ? "Expand Chat" : "Minimize Chat"}
              aria-label={isMinimized ? "Expand Chat" : "Minimize Chat"}
            >
              <Minus size={16} />
            </button>
            <button
              type="button"
              onClick={() => { setIsOpen(false); setIsMinimized(false); }}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Close Chat"
              aria-label="Close Chat"
            >
              <X size={17} />
            </button>
          </div>
        </header>

        {/* Content (Visible when not minimized) */}
        {!isMinimized && (
          <>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#F8FAF9] space-y-3 text-xs">
              {messages.map((msg, idx) => {
                const isUser = msg.sender === 'user';
                const isLastMessage = idx === messages.length - 1;

                return (
                  <div key={idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    <div 
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-line shadow-2xs ${
                        isUser
                          ? 'bg-[#EAF6EE] text-[#172019] border border-[#DCE4DF] rounded-tr-xs'
                          : 'bg-white border border-[#DCE4DF] text-[#26332B] rounded-tl-xs'
                      }`}
                    >
                      {msg.text}

                      {/* Direct Website Route Action Button */}
                      {msg.link && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100">
                          <Link
                            to={msg.link.url}
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center gap-1.5 bg-[#16803A] hover:bg-[#0F5C2A] text-white font-semibold px-3 py-1.5 rounded-[10px] text-xs transition-colors shadow-2xs"
                          >
                            <span>{msg.link.text}</span>
                            <ArrowRight size={13} />
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Quick Action Chips on the last message */}
                    {!isUser && isLastMessage && msg.quickReplies && msg.quickReplies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5 max-w-[95%]">
                        {msg.quickReplies.map((qr, qIdx) => (
                          <button
                            key={qIdx}
                            type="button"
                            onClick={() => handleQuickReply(qr)}
                            className="px-3 py-1.5 bg-white hover:bg-[#EAF6EE] text-[#16803A] border border-[#DCE4DF] hover:border-[#16803A] rounded-full text-xs font-semibold transition-all shadow-2xs cursor-pointer active:scale-95"
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
                <div className="flex items-center gap-2 text-slate-500 bg-white border border-[#DCE4DF] px-3 py-2 rounded-2xl rounded-tl-xs w-fit shadow-2xs text-xs">
                  <span className="w-1.5 h-1.5 bg-[#16803A] rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-[#16803A] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-[#16803A] rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  <span className="ml-1 text-[11px] font-medium text-slate-400">RESTI Assistant is typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="p-2.5 bg-white border-t border-[#DCE4DF] flex gap-2 items-center shrink-0">
              <input
                ref={inputRef}
                type={isCapturingEmail ? 'email' : 'text'}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isCapturingEmail ? "Enter your email address..." : "Ask RESTI something..."}
                className="flex-1 bg-[#F8FAF9] border border-[#DCE4DF] focus:bg-white focus:border-[#16803A] focus:ring-2 focus:ring-[#16803A]/20 rounded-xl py-2 px-3 text-xs sm:text-sm transition-all outline-none text-[#172019] placeholder:text-slate-400"
                aria-label="Type your message"
              />

              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="w-9 h-9 bg-[#16803A] text-white rounded-xl flex items-center justify-center hover:bg-[#0F5C2A] active:scale-95 disabled:opacity-40 disabled:hover:bg-[#16803A] transition-all shrink-0 cursor-pointer shadow-2xs"
                title="Send message"
                aria-label="Send message"
              >
                <Send size={14} className={inputValue.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
              </button>
            </form>
          </>
        )}
      </div>

      {/* ── FLOATING TRIGGER BUBBLE ── */}
      <button
        type="button"
        onClick={() => {
          if (isOpen && isMinimized) {
            setIsMinimized(false);
          } else {
            setIsOpen(!isOpen);
            setIsMinimized(false);
          }
        }}
        title="Chat with RESTI"
        aria-label="Chat with RESTI"
        className="relative w-13 h-13 bg-[#16803A] hover:bg-[#0F5C2A] text-white rounded-full shadow-[0_8px_24px_rgba(22,128,58,0.35)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 z-50 group cursor-pointer border border-white/20"
      >
        {isOpen && !isMinimized ? (
          <X size={22} className="group-hover:rotate-90 transition-transform duration-200" />
        ) : (
          <>
            <MessageCircle size={24} className="group-hover:scale-110 transition-transform duration-200" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                {unreadCount}
              </span>
            )}
          </>
        )}
      </button>
    </aside>
  );
}
