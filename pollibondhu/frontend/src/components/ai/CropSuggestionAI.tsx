import { useState } from 'react';
import { Sparkles, Bot, Loader2, Sprout, ChevronDown, ChevronUp, Leaf, Droplets, Calendar, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import api from '@/utils/api';

const seasons = [
  { value: 'Rabi', label: 'Rabi (Winter)', emoji: '❄️', months: 'Oct–Feb' },
  { value: 'Kharif', label: 'Kharif (Monsoon)', emoji: '☔', months: 'Jun–Nov' },
  { value: 'Pre-Kharif', label: 'Pre-Kharif (Summer)', emoji: '☀️', months: 'Mar–May' },
];

const soilTypes = [
  'Clay loam', 'Sandy loam', 'Loam', 'Clay', 'Silt', 'Sandy', 'Alluvial', 'Peat', 'Not sure'
];

const waterOptions = [
  { value: 'high', label: 'High (Irrigation available)', emoji: '💧💧' },
  { value: 'medium', label: 'Medium (Rainfed + some irrigation)', emoji: '💧' },
  { value: 'low', label: 'Low (Rainfed only)', emoji: '🏜️' },
];

const districts = [
  'Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh',
  'Comilla', 'Gazipur', 'Bogura', 'Dinajpur', 'Jessore', 'Cox\'s Bazar',
];

const previousCrops = [
  'None (New land)', 'Boro Paddy', 'Aman Paddy', 'Potato', 'Mustard', 'Wheat', 'Jute', 'Vegetables', 'Other'
];

interface SuggestionResult {
  content: string;
}

export default function CropSuggestionAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [expanded, setExpanded] = useState(true);

  const [form, setForm] = useState({
    season: '',
    soilType: '',
    waterAvailable: '',
    location: '',
    previousCrop: '',
    plotSize: '',
  });

  async function getSuggestion() {
    if (!form.season) return;
    setLoading(true);
    setResult('');
    try {
      const res = await api.post('/ai/crop-suggestion', form);
      setResult(res.data.response);
    } catch {
      setResult('Sorry, I could not generate a suggestion right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-polli-200 bg-gradient-to-br from-emerald-50/50 to-white">
      <CardContent className="p-5">
        {/* Header */}
        <button onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl text-white">
              <Sparkles size={20} />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-earth-900 flex items-center gap-2">
                🤖 AI Crop Suggestion
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">INSTANT</span>
              </h3>
              <p className="text-xs text-earth-500">Get personalized crop recommendations based on your conditions</p>
            </div>
          </div>
          {isOpen ? <ChevronUp size={18} className="text-earth-400" /> : <ChevronDown size={18} className="text-earth-400" />}
        </button>

        {/* Form */}
        {isOpen && (
          <div className="mt-5 space-y-4">
            {/* Season Selection */}
            <div>
              <label className="text-xs font-bold text-earth-600 mb-2 block">Which season? *</label>
              <div className="grid grid-cols-3 gap-2">
                {seasons.map(s => (
                  <button key={s.value} onClick={() => setForm(f => ({ ...f, season: s.value }))}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition ${
                      form.season === s.value
                        ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                        : 'border-earth-200 hover:border-emerald-300'
                    }`}>
                    <span className="text-xl">{s.emoji}</span>
                    <span className="text-xs font-bold">{s.label}</span>
                    <span className="text-[10px] text-earth-400">{s.months}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Soil Type */}
            <div>
              <label className="text-xs font-bold text-earth-600 mb-1 block">Soil type</label>
              <select value={form.soilType} onChange={e => setForm(f => ({ ...f, soilType: e.target.value }))}
                className="w-full border border-earth-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="">Select soil type</option>
                {soilTypes.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Water Availability */}
            <div>
              <label className="text-xs font-bold text-earth-600 mb-2 block">Water availability</label>
              <div className="grid grid-cols-3 gap-2">
                {waterOptions.map(w => (
                  <button key={w.value} onClick={() => setForm(f => ({ ...f, waterAvailable: w.value }))}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition text-xs ${
                      form.waterAvailable === w.value
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-earth-200 hover:border-blue-300'
                    }`}>
                    <span>{w.emoji}</span>
                    <span className="font-medium">{w.label.split('(')[0].trim()}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Location + Previous Crop */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-earth-600 mb-1 block">District</label>
                <select value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  className="w-full border border-earth-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="">Select district</option>
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-earth-600 mb-1 block">Previous crop</label>
                <select value={form.previousCrop} onChange={e => setForm(f => ({ ...f, previousCrop: e.target.value }))}
                  className="w-full border border-earth-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="">Select previous crop</option>
                  {previousCrops.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Plot Size */}
            <div>
              <label className="text-xs font-bold text-earth-600 mb-1 block">Plot size (optional)</label>
              <input value={form.plotSize} onChange={e => setForm(f => ({ ...f, plotSize: e.target.value }))}
                placeholder="e.g. 20 decimals, 1 acre, small garden"
                className="w-full border border-earth-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            {/* Get Suggestion Button */}
            <Button onClick={getSuggestion} disabled={!form.season || loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800">
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Analyzing your conditions...</>
              ) : (
                <><Sparkles size={16} /> Get AI Crop Recommendation</>
              )}
            </Button>

            {/* Result */}
            {result && (
              <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="flex items-center gap-2 mb-2">
                  <Bot size={16} className="text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-700">AI Recommendation</span>
                </div>
                <div className="text-sm text-earth-700 whitespace-pre-wrap leading-relaxed">
                  {result}
                </div>
              </div>
            )}

            {/* Quick suggestions */}
            {!result && !loading && (
              <div className="mt-3">
                <p className="text-[10px] text-earth-400 font-medium mb-2">Quick questions:</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'What crop gives highest profit this season?',
                    'Best crop for clay soil with less water',
                    'Which crop after potato harvest?',
                    'Most profitable crop in Rajshahi',
                  ].map((q, i) => (
                    <button key={i} onClick={() => {
                      const updated = { ...form, season: 'Rabi' };
                      setForm(updated);
                      setLoading(true);
                      api.post('/ai/crop-suggestion', updated)
                        .then(res => setResult(res.data.response))
                        .catch(() => setResult('Could not get suggestion'))
                        .finally(() => setLoading(false));
                    }}
                      className="text-[10px] px-2.5 py-1 rounded-full border border-earth-200 text-earth-500 hover:bg-emerald-50 hover:border-emerald-300 transition">
                      💡 {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
