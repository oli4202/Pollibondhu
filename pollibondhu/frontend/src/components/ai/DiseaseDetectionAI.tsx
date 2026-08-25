import { useState } from 'react';
import { Bug, Sparkles, Bot, Loader2, ChevronDown, ChevronUp, Leaf, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import api from '@/utils/api';

const cropOptions = [
  'Boro Paddy', 'Aman Paddy', 'Potato', 'Mustard', 'Wheat', 'Jute', 'Maize',
  'Onion', 'Tomato', 'Chili', 'Brinjal', 'Cauliflower', 'Cabbage', 'Mango', 'Banana', 'Other'
];

const commonSymptoms = [
  'Brown spots on leaves', 'Yellowing of leaves', 'White powdery growth',
  'Wilting/drooping', 'Leaf curling', 'Stunted growth', 'Root rot',
  'Fruit/flower dropping', 'Insect holes in leaves', 'Sticky honeydew on plant',
  'Orange rust pustules', 'Black spots with yellow halo', 'Stem breaking',
  'Delayed flowering', 'Poor grain filling',
];

export default function DiseaseDetectionAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [crop, setCrop] = useState('');
  const [symptoms, setSymptoms] = useState('');

  async function diagnose() {
    if (!crop || !symptoms) return;
    setLoading(true);
    setResult('');
    try {
      const res = await api.post('/ai/disease-diagnosis', { cropName: crop, symptoms });
      setResult(res.data.response);
    } catch {
      setResult('Could not analyze. Please try describing the symptoms differently.');
    } finally { setLoading(false); }
  }

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50/50 to-white">
      <CardContent className="p-5">
        <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-red-500 to-amber-500 rounded-xl text-white"><Bug size={20} /></div>
            <div className="text-left">
              <h3 className="font-bold text-earth-900 flex items-center gap-2">
                🔍 AI Disease Detection
                <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">INSTANT</span>
              </h3>
              <p className="text-xs text-earth-500">Describe symptoms — get instant diagnosis and treatment</p>
            </div>
          </div>
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {isOpen && (
          <div className="mt-5 space-y-4">
            <div>
              <label className="text-xs font-bold text-earth-600 mb-1 block">Which crop is affected? *</label>
              <select value={crop} onChange={e => setCrop(e.target.value)}
                className="w-full border border-earth-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500">
                <option value="">Select crop...</option>
                {cropOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-earth-600 mb-2 block">Describe symptoms *</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {commonSymptoms.slice(0, 10).map(s => (
                  <button key={s} onClick={() => setSymptoms(prev => prev ? `${prev}, ${s}` : s)}
                    className="text-[10px] px-2 py-1 rounded-full border border-earth-200 text-earth-500 hover:bg-amber-50 hover:border-amber-300 transition">
                    {s}
                  </button>
                ))}
              </div>
              <textarea value={symptoms} onChange={e => setSymptoms(e.target.value)}
                placeholder="Or describe symptoms in detail — e.g. 'Brown spots appearing on lower leaves, spreading upward, white fuzzy growth underneath'"
                rows={3}
                className="w-full border border-earth-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500" />
            </div>

            <Button onClick={diagnose} disabled={!crop || !symptoms || loading}
              className="w-full bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-600 hover:to-red-600">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Analyzing symptoms...</> : <><Sparkles size={16} /> Diagnose Now</>}
            </Button>

            {result && (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <div className="flex items-center gap-2 mb-2"><Bot size={16} className="text-amber-600" /><span className="text-xs font-bold text-amber-700">Diagnosis & Treatment</span></div>
                <div className="text-sm text-earth-700 whitespace-pre-wrap leading-relaxed">{result}</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
