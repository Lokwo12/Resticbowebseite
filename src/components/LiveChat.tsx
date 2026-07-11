import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, AtSign, Loader } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';

export function LiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ sender: 'bot' | 'user', text: string, timestamp?: string }[]>([
    { sender: 'bot', text: 'Hi there! 👋 How can we help you today?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [email, setEmail] = useState('');
  const [isCapturingEmail, setIsCapturingEmail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize session from local storage
  useEffect(() => {
    const savedSession = localStorage.getItem('resti_chat_session');
    if (savedSession) {
      setSessionId(savedSession);
    }
  }, []);

  // Poll for new messages if session exists and chat is open
  useEffect(() => {
    let intervalId: ReturnType<typeof setTimeout>;

    const pollMessages = async () => {
      if (!sessionId || !isOpen) return;
      try {
        const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/livechat/session/${sessionId}`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.session && data.session.messages) {
            // Keep the initial welcome message, then append the fetched messages
            const formattedMessages = data.session.messages.map((m: any) => ({
              sender: m.sender,
              text: m.text,
              timestamp: m.timestamp
            }));
            setMessages([
              { sender: 'bot', text: 'Hi there! 👋 How can we help you today?' },
              ...formattedMessages
            ]);
            
            if (data.session.email) setEmail(data.session.email);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    if (isOpen && sessionId) {
      pollMessages(); // Fetch immediately
      intervalId = setInterval(pollMessages, 3000); // Poll every 3 seconds
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isOpen, sessionId]);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg = inputValue.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMsg, timestamp: new Date().toISOString() }]);
    setInputValue('');

    let currentEmail = email;

    if (isCapturingEmail) {
      if (!userMsg.includes('@') || !userMsg.includes('.')) {
        setTimeout(() => {
          setMessages(prev => [...prev, { sender: 'bot', text: 'Hmm, that doesn\'t look like a valid email. Please try again so we can reach you.' }]);
        }, 500);
        return;
      }
      currentEmail = userMsg;
      setEmail(userMsg);
      setIsCapturingEmail(false);
      setMessages(prev => [...prev, { sender: 'bot', text: 'Perfect! We have securely saved your message. Our team will email you back shortly or reply here if they are online. 💚' }]);
    } else if (!sessionId && messages.length <= 1) {
      // First time chatting, ask for email right away
      setTimeout(() => {
        setMessages(prev => [...prev, { sender: 'bot', text: 'Thanks for reaching out! To make sure we can get back to you if we get disconnected, could you please provide your email address?' }]);
        setIsCapturingEmail(true);
      }, 500);
    }

    // Always send the message to the backend (unless we are just asking for email)
    if (!isCapturingEmail) {
      setIsSubmitting(true);
      try {
        const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/livechat/message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({ 
            sessionId: sessionId,
            email: currentEmail, 
            message: userMsg 
          })
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.sessionId && !sessionId) {
            setSessionId(data.sessionId);
            localStorage.setItem('resti_chat_session', data.sessionId);
          }
        }
      } catch (err) {
        console.error('Chat error:', err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Window */}
      <div 
        className={`absolute bottom-16 right-0 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 transition-all duration-300 origin-bottom-right transform ${isOpen ? 'scale-100 opacity-100 visible' : 'scale-90 opacity-0 invisible'}`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg font-heading tracking-tight flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse border-2 border-emerald-600"></span>
                Resti CBO Support
              </h3>
              <p className="text-emerald-100 text-xs mt-1">We usually reply within a few hours</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="h-80 overflow-y-auto p-4 bg-slate-50/50 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.sender === 'user' 
                  ? 'bg-emerald-600 text-white rounded-tr-sm' 
                  : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm shadow-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isSubmitting && (
            <div className="flex justify-end">
              <div className="bg-emerald-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
                <Loader className="animate-spin" size={16} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center">
          <div className="relative flex-1">
            {isCapturingEmail && <AtSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />}
            <input
              type={isCapturingEmail ? "email" : "text"}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isCapturingEmail ? "Enter your email..." : "Type a message..."}
              disabled={isSubmitting}
              className={`w-full bg-slate-100 border-transparent focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl py-2.5 pr-4 text-sm transition-all outline-none ${isCapturingEmail ? 'pl-9' : 'pl-4'}`}
            />
          </div>
          <button 
            type="submit" 
            disabled={!inputValue.trim() || isSubmitting}
            className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-colors shrink-0"
          >
            <Send size={16} className={inputValue.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
          </button>
        </form>
      </div>

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-emerald-600 text-white rounded-full shadow-[0_8px_30px_rgba(5,150,105,0.4)] flex items-center justify-center hover:bg-emerald-700 hover:scale-105 transition-all duration-300 z-50 group"
      >
        {isOpen ? (
          <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
        ) : (
          <MessageCircle size={28} className="group-hover:scale-110 transition-transform duration-300" />
        )}
      </button>
    </div>
  );
}
