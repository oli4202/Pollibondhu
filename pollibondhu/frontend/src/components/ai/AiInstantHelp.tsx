import { useState, useRef, useEffect } from 'react';
import { Sparkles, Bot, X, Send, Loader2, Zap, HelpCircle } from 'lucide-react';
import api from '@/utils/api';

interface QuickHelpProps {
  page: string;
  context?: string;
  suggestions?: string[];
}

const defaultSuggestions: Record<string, string[]> = {
  '/agriculture': [
    'What crop should I plant now?',
    'How to control paddy blast disease?',
    'Current potato price in Dhaka',
    'Best fertilizer for Boro paddy',
    'When to harvest Aman paddy?',
  ],
  '/marketplace': [
    'Is now a good time to sell paddy?',
    'Where can I get best potato prices?',
    'How to store crops for better price?',
    'Price prediction for next month',
  ],
  '/services': [
    'How to apply for NID?',
    'Documents needed for birth certificate',
    'How long does trade license take?',
    'Can I apply online for land records?',
  ],
  '/healthcare': [
    'What vaccines are due for my child?',
    'Symptoms of dengue fever',
    'How to register for blood donation?',
    'Nearest health center location',
  ],
  '/village-market': [
    'How to sell my crops directly?',
    'Fair price for used farming equipment',
    'How to list items for sale?',
  ],
  '/community': [
    'How to start a discussion?',
    'How to reply to a post?',
    'Can I share photos in posts?',
  ],
  '/emergency': [
    'What to do in a flood emergency?',
    'Emergency numbers in Bangladesh',
    'First aid for snake bite',
    'How to report an emergency?',
  ],
};

export default function AiInstantHelp({ page, context, suggestions }: QuickHelpProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ q: string; a: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const pageSuggestions = suggestions || defaultSuggestions[page] || defaultSuggestions['/agriculture'] || [];

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  async function askQuestion(q?: string) {
    const question = q || query;
    if (!question.trim() || loading) return;
    setQuery('');
    setLoading(true);
    setAnswer('');
    try {
      const res = await api.post('/ai/quick-help', { question, page });
      const ans = res.data.response;
      setAnswer(ans);
      setHistory(prev => [...prev, { q: question, a: ans }].slice(-5));
    } catch {
      setAnswer('Sorry, AI is temporarily unavailable. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-4 z-40 group">
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg transition-all ${
          isOpen
            ? 'bg-earth-800 text-white'
            : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 hover:shadow-xl hover:scale-105'
        }`}>
          {isOpen ? <X size={16} /> : <><Zap size={16} /><span className="text-sm font-bold hidden sm:inline">AI Help</span></>}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-400" />
            </span>
          )}
        </div>
      </button>

      {/* Help panel */}
      {isOpen && (
        <div className="fixed bottom-32 right-4 z-40 w-80 bg-white rounded-2xl shadow-2xl border border-earth-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-white/20 rounded-lg"><Zap size={14} /></div>
              <div>
                <p className="text-sm font-bold">⚡ Instant AI Help</p>
                <p className="text-[10px] text-amber-100">Ask anything — get instant answers</p>
              </div>
            </div>
          </div>

          {/* Quick suggestions */}
          {!answer && !loading && (
            <div className="p-3 border-b border-earth-100">
              <p className="text-[10px] font-bold text-earth-500 mb-2">💡 Quick questions:</p>
              <div className="flex flex-wrap gap-1.5">
                {pageSuggestions.slice(0, 5).map((s, i) => (
                  <button key={i} onClick={() => { setQuery(s); askQuestion(s); }}
                    className="text-[10px] px-2.5 py-1.5 rounded-full border border-earth-200 text-earth-600 hover:bg-amber-50 hover:border-amber-300 transition text-left">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Answer area */}
          <div className="max-h-60 overflow-y-auto">
            {loading && (
              <div className="p-4 flex items-center gap-2 text-amber-600">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-xs font-medium">Thinking...</span>
              </div>
            )}
            {answer && (
              <div className="p-3">
                <div className="flex items-start gap-2">
                  <Bot size={14} className="text-amber-500 mt-0.5 shrink-0" />
                  <div className="text-xs text-earth-700 whitespace-pre-wrap leading-relaxed">{answer}</div>
                </div>
              </div>
            )}
            {history.length > 1 && !loading && (
              <div className="px-3 pb-2">
                <button onClick={() => { setAnswer(''); }}
                  className="text-[10px] text-amber-600 hover:text-amber-700 font-medium">← Ask another question</button>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-earth-100 bg-earth-50/50">
            <div className="flex gap-2">
              <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && askQuestion()}
                placeholder="Type your question..."
                className="flex-1 border border-earth-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500" />
              <button onClick={() => askQuestion()} disabled={loading || !query.trim()}
                className="p-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-40 transition">
                <Send size={12} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
