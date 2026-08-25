import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Bot, X, Send, Sparkles, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/utils/api';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

const pageContextMap: Record<string, string> = {
  '/': 'Home page of PolliBondhu Smart Village Platform',
  '/agriculture': 'Agriculture advisory page — crops, weather, fertilizers, market prices',
  '/marketplace': 'Market prices page — live commodity prices from DAM and local markets',
  '/services': 'Government services — birth registration, trade license, NID, land records',
  '/healthcare': 'Healthcare services — vaccination, health cards, blood donation, ambulance',
  '/education': 'Education page — courses, institutions, enrollment',
  '/community': 'Community forum — discussions, polls, expert advice',
  '/ngos': 'NGOs and social support organizations',
  '/emergency': 'Emergency services — fire, police, medical',
  '/village-market': 'Village market — buy, sell, rent within the community',
  '/login': 'Login page',
  '/register': 'Registration page',
};

const quickPrompts = [
  'What crops should I plant this season?',
  'How do I register for a birth certificate?',
  'What are today\'s potato prices?',
  'How do I file a complaint?',
  'What vaccines are available?',
  'How can I get an NID card?',
];

export default function AiChatWidget() {
  const location = useLocation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize with page-aware welcome message
  useEffect(() => {
    const pageContext = pageContextMap[location.pathname] || location.pathname;
    if (messages.length === 0) {
      setMessages([{
        role: 'ai',
        content: user
          ? `Hello ${user.full_name?.split(' ')[0] || 'there'}! 👋 I'm your PolliBondhu AI assistant. I can help with agriculture advice, government services, healthcare, and more. What would you like to know?`
          : `Welcome to PolliBondhu! 🌾 I'm your AI assistant. I can help with:\n\n• 🌾 **Agriculture** — crop advice, market prices\n• 🏛️ **Gov Services** — NID, birth certificate, trade license\n• 🏥 **Healthcare** — vaccination, health cards\n• 📋 **Complaints** — how to file and track\n\nHow can I help you today?`
      }]);
    }
  }, [location.pathname, user]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const handleSend = useCallback(async (text?: string) => {
    const query = text || input;
    if (!query.trim() || loading) return;

    const userMsg = query;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    // Add page context to the prompt
    const pageContext = pageContextMap[location.pathname] || '';
    const contextualPrompt = pageContext
      ? `[User is on: ${pageContext}] ${userMsg}`
      : userMsg;

    try {
      const res = await api.post('/ai/chat', { prompt: contextualPrompt });
      setMessages(prev => [...prev, { role: 'ai', content: res.data.response }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: 'I\'m having trouble connecting right now. Please try again in a moment, or visit our Help Center at /help for assistance.'
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, location.pathname]);

  // Public pages: show floating widget always (no auth check)
  // Dashboard pages: also show (already in layouts, but this ensures it)
  const isPublicPage = !location.pathname.startsWith('/dashboard') &&
    !location.pathname.startsWith('/admin') &&
    !location.pathname.startsWith('/officer') &&
    !location.pathname.startsWith('/provider');

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative bg-gradient-to-br from-polli-600 to-polli-700 hover:from-polli-700 hover:to-polli-800 text-white rounded-full p-4 shadow-xl transition-all hover:scale-110 hover:shadow-2xl"
          aria-label="Open AI Assistant"
        >
          <Bot className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className={`bg-white rounded-2xl shadow-2xl border border-earth-200 overflow-hidden transition-all duration-300 ${
          isMinimized ? 'w-72 h-14' : 'w-[380px] h-[560px]'
        } flex flex-col`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-polli-600 to-polli-700 text-white px-4 py-3 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <span className="font-semibold text-sm">PolliBondhu AI</span>
                {!isMinimized && (
                  <p className="text-[10px] text-polli-100">Always here to help 🌾</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                aria-label={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gradient-to-b from-earth-50/50 to-white">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                      msg.role === 'user'
                        ? 'bg-polli-600 text-white rounded-br-md'
                        : 'bg-white text-earth-800 border border-earth-200 rounded-bl-md shadow-sm'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-earth-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-2 text-earth-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-xs">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick prompts (shown only at start) */}
                {messages.length <= 1 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-xs text-earth-400 font-medium px-1">💡 Quick questions:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {quickPrompts.map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => handleSend(prompt)}
                          className="text-xs px-3 py-1.5 rounded-full border border-earth-200 text-earth-600 hover:bg-polli-50 hover:border-polli-300 hover:text-polli-700 transition-colors"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-3 py-3 border-t border-earth-100 bg-white shrink-0">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder={user ? 'Ask me anything...' : 'Ask about services, crops, health...'}
                    className="flex-1 border border-earth-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500 focus:border-transparent bg-earth-50 transition-all"
                    disabled={loading}
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={loading || !input.trim()}
                    className="bg-polli-600 text-white p-2.5 rounded-xl hover:bg-polli-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                {!user && (
                  <p className="text-[10px] text-earth-400 text-center mt-2">
                    <a href="/login" className="text-polli-600 hover:underline">Log in</a> for personalized help
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
