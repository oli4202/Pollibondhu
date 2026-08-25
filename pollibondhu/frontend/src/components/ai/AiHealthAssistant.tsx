import { useState } from 'react';
import { Heart, Sparkles, Bot, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import api from '@/utils/api';

const commonConcerns = [
  'Fever for 2+ days', 'Persistent cough', 'Headache and dizziness',
  'Stomach pain and diarrhea', 'Skin rash or itching', 'Joint or body pain',
  'Breathing difficulty', 'Eye pain or redness', 'Ear pain',
  'Child not eating', 'Pregnancy nutrition advice', 'Diabetes management',
];

export default function AiHealthAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');

  async function askHealth() {
    if (!symptoms) return;
    setLoading(true);
    setResult('');
    try {
      const res = await api.post('/ai/health-assistant', { symptoms, age, gender });
      setResult(res.data.response);
    } catch {
      setResult('Could not provide health guidance. Please visit your nearest health center for professional advice.');
    } finally { setLoading(false); }
  }

  return (
    <Card className="border-red-200 bg-gradient-to-br from-red-50/50 to-white">
      <CardContent className="p-5">
        <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl text-white"><Heart size={20} /></div>
            <div className="text-left">
              <h3 className="font-bold text-earth-900 flex items-center gap-2">
                🏥 AI Health Assistant
                <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">INSTANT</span>
              </h3>
              <p className="text-xs text-earth-500">Describe symptoms — get instant guidance on what to do</p>
            </div>
          </div>
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {isOpen && (
          <div className="mt-5 space-y-4">
            <div>
              <label className="text-xs font-bold text-earth-600 mb-2 block">What's the concern?</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {commonConcerns.map(c => (
                  <button key={c} onClick={() => { setSymptoms(c); }}
                    className="text-[10px] px-2.5 py-1.5 rounded-full border border-earth-200 text-earth-600 hover:bg-red-50 hover:border-red-300 transition">
                    {c}
                  </button>
                ))}
              </div>
              <textarea value={symptoms} onChange={e => setSymptoms(e.target.value)}
                placeholder="Describe symptoms in detail..."
                rows={3}
                className="w-full border border-earth-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-earth-600 mb-1 block">Age</label>
                <input value={age} onChange={e => setAge(e.target.value)}
                  placeholder="e.g. 35" className="w-full border border-earth-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-earth-600 mb-1 block">Gender</label>
                <select value={gender} onChange={e => setGender(e.target.value)}
                  className="w-full border border-earth-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500">
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <Button onClick={askHealth} disabled={!symptoms || loading}
              className="w-full bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Analyzing symptoms...</> : <><Sparkles size={16} /> Get Health Guidance</>}
            </Button>

            {result && (
              <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                <div className="flex items-center gap-2 mb-2"><Bot size={16} className="text-red-600" /><span className="text-xs font-bold text-red-700">Health Guidance</span></div>
                <div className="text-sm text-earth-700 whitespace-pre-wrap leading-relaxed">{result}</div>
                <p className="mt-3 text-[10px] text-earth-400 border-t border-red-100 pt-2">⚠️ This is general guidance only. For serious symptoms, please visit a healthcare professional immediately.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
