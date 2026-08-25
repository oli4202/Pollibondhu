import { useState } from 'react';
import { TrendingUp, Sparkles, Bot, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import api from '@/utils/api';

const commodityOptions = [
  'Boro Paddy', 'Aman Paddy', 'Potato', 'Mustard', 'Wheat', 'Onion', 'Tomato',
  'Chili', 'Garlic', 'Mango', 'Banana', 'Jute', 'Maize', 'Lentil', 'Mung', 'Other'
];

export default function MarketPriceAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [commodity, setCommodity] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [market, setMarket] = useState('');

  async function analyze() {
    if (!commodity) return;
    setLoading(true);
    setResult('');
    try {
      const res = await api.post('/ai/price-analysis', { commodity, currentPrice, market });
      setResult(res.data.response);
    } catch {
      setResult('Could not analyze prices right now. Please try again.');
    } finally { setLoading(false); }
  }

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-white">
      <CardContent className="p-5">
        <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl text-white"><TrendingUp size={20} /></div>
            <div className="text-left">
              <h3 className="font-bold text-earth-900 flex items-center gap-2">
                📊 AI Price Analysis
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">INSTANT</span>
              </h3>
              <p className="text-xs text-earth-500">Should I sell now or wait? Get AI-powered market advice</p>
            </div>
          </div>
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {isOpen && (
          <div className="mt-5 space-y-4">
            <div>
              <label className="text-xs font-bold text-earth-600 mb-1 block">Which commodity? *</label>
              <select value={commodity} onChange={e => setCommodity(e.target.value)}
                className="w-full border border-earth-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500">
                <option value="">Select commodity...</option>
                {commodityOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-earth-600 mb-1 block">Your price (৳/unit)</label>
                <input value={currentPrice} onChange={e => setCurrentPrice(e.target.value)}
                  placeholder="e.g. 28" className="w-full border border-earth-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-earth-600 mb-1 block">Market</label>
                <input value={market} onChange={e => setMarket(e.target.value)}
                  placeholder="e.g. Dhaka Central" className="w-full border border-earth-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <Button onClick={analyze} disabled={!commodity || loading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Analyzing market...</> : <><Sparkles size={16} /> Analyze Prices</>}
            </Button>

            {result && (
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 mb-2"><Bot size={16} className="text-blue-600" /><span className="text-xs font-bold text-blue-700">Market Analysis</span></div>
                <div className="text-sm text-earth-700 whitespace-pre-wrap leading-relaxed">{result}</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
