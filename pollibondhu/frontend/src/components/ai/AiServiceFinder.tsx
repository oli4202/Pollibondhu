import { useState } from 'react';
import { FileText, Sparkles, Bot, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import api from '@/utils/api';

const commonNeeds = [
  'Apply for NID card', 'Get birth certificate', 'Correct NID information',
  'Get a trade license', 'Apply for health card', 'Get land records',
  'File a complaint', 'Register marriage', 'Get income certificate',
  'Apply for scholarship', 'Register for vaccination', 'Request blood donation',
];

export default function AiServiceFinder() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [query, setQuery] = useState('');
  const [district, setDistrict] = useState('');

  async function findService() {
    if (!query) return;
    setLoading(true);
    setResult('');
    try {
      const res = await api.post('/ai/service-finder', { query, district });
      setResult(res.data.response);
    } catch {
      setResult('Could not find service information. Please try again.');
    } finally { setLoading(false); }
  }

  return (
    <Card className="border-polli-200 bg-gradient-to-br from-polli-50/50 to-white">
      <CardContent className="p-5">
        <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-polli-500 to-polli-600 rounded-xl text-white"><FileText size={20} /></div>
            <div className="text-left">
              <h3 className="font-bold text-earth-900 flex items-center gap-2">
                🤖 AI Service Finder
                <span className="text-[10px] bg-polli-100 text-polli-700 px-2 py-0.5 rounded-full font-bold">INSTANT</span>
              </h3>
              <p className="text-xs text-earth-500">Tell me what you need — I'll find the right service and guide you</p>
            </div>
          </div>
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {isOpen && (
          <div className="mt-5 space-y-4">
            <div>
              <label className="text-xs font-bold text-earth-600 mb-2 block">What do you need help with?</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {commonNeeds.map(n => (
                  <button key={n} onClick={() => { setQuery(n); findService(); }}
                    className="text-[10px] px-2.5 py-1.5 rounded-full border border-earth-200 text-earth-600 hover:bg-polli-50 hover:border-polli-300 transition">
                    {n}
                  </button>
                ))}
              </div>
              <input value={query} onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && findService()}
                placeholder="Or type what you need..."
                className="w-full border border-earth-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-polli-500" />
            </div>

            <div>
              <label className="text-xs font-bold text-earth-600 mb-1 block">Your district (optional)</label>
              <select value={district} onChange={e => setDistrict(e.target.value)}
                className="w-full border border-earth-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-polli-500">
                <option value="">All districts</option>
                {['Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh'].map(d =>
                  <option key={d} value={d}>{d}</option>
                )}
              </select>
            </div>

            <Button onClick={findService} disabled={!query || loading}
              className="w-full bg-gradient-to-r from-polli-600 to-polli-700 hover:from-polli-700 hover:to-polli-800">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Searching services...</> : <><Sparkles size={16} /> Find My Service</>}
            </Button>

            {result && (
              <div className="p-4 bg-polli-50 rounded-xl border border-polli-200">
                <div className="flex items-center gap-2 mb-2"><Bot size={16} className="text-polli-600" /><span className="text-xs font-bold text-polli-700">Service Guide</span></div>
                <div className="text-sm text-earth-700 whitespace-pre-wrap leading-relaxed">{result}</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
