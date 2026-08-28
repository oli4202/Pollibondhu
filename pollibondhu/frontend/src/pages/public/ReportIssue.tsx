import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Sparkles, MapPin, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/utils/api';

const issueCategories = [
  { value: 'Infrastructure Problem', label: 'Infrastructure', emoji: '🏗️', desc: 'Roads, bridges, buildings' },
  { value: 'Water Supply Issue', label: 'Water Supply', emoji: '💧', desc: 'Pipes, pumps, quality' },
  { value: 'Sanitation & Waste', label: 'Sanitation', emoji: '🗑️', desc: 'Waste, drainage, toilets' },
  { value: 'Electricity Outage', label: 'Electricity', emoji: '⚡', desc: 'Power outage, lines' },
  { value: 'Road & Transport', label: 'Roads', emoji: '🛣️', desc: 'Road damage, transport' },
  { value: 'Education Facility', label: 'Education', emoji: '🎓', desc: 'Schools, teachers' },
  { value: 'Health Service Issue', label: 'Health', emoji: '🏥', desc: 'Hospitals, doctors, medicine' },
  { value: 'Corruption or Misconduct', label: 'Corruption', emoji: '⚠️', desc: 'Misconduct, bribery' },
  { value: 'Environmental Concern', label: 'Environment', emoji: '🌳', desc: 'Pollution, deforestation' },
  { value: 'Other', label: 'Other', emoji: '📌', desc: 'General issues' },
];

const locationSuggestions = [
  'Main road near bazaar', 'Near government primary school', 'Union Parishad office area',
  'Market area', 'Near the bridge/embankment', 'Agricultural field area',
  'Near health center', 'Village mosque area',
];

const aiDescriptions: Record<string, string[]> = {
  'Infrastructure Problem': [
    'The main road in our area has developed large potholes making it dangerous for vehicles and pedestrians. This has been going on for several weeks and needs immediate repair.',
    'The footbridge near our village has become structurally unsafe. The railing is broken and the surface is slippery during rain. Many people cross this daily including school children.',
    'The community building roof is leaking during rain. Several important documents and equipment stored there are getting damaged. Urgent repair needed.',
  ],
  'Water Supply Issue': [
    'Our area has been without clean drinking water for 3 days. The main tube well is not functioning and the backup supply is contaminated. Children are getting sick.',
    'The water supply pipe has burst near our area causing water wastage and making the road muddy. This needs immediate repair to prevent further damage.',
  ],
  'Electricity Outage': [
    'Our entire area has been without electricity for the past 2 days. The local electricity office says there is a transformer problem but no timeline for repair. This is affecting daily life severely.',
    'Frequent power cuts in our area — sometimes 4-5 times a day, each lasting 2-3 hours. This is destroying our refrigerator contents and affecting small businesses.',
  ],
  'Health Service Issue': [
    'The doctor at our Union Health Center has been absent for the past week. Patients are being turned away without treatment. This is unacceptable for a government health facility.',
    'Essential medicines including paracetamol and ORS are not available at the local health center. Patients have to travel 30km to the upazila hospital.',
  ],
  'Road & Transport': [
    'The road from our village to the bazaar is severely damaged with large potholes. During rain it becomes completely impassable. School children and elderly people are suffering.',
  ],
  'Education Facility': [
    'The government primary school in our area has a severe teacher shortage — only 2 teachers for 200 students. The school building also needs urgent repair.',
  ],
  'Sanitation & Waste': [
    'The main drain in our ward is completely blocked causing water logging during every rain. Garbage collection has stopped for 2 weeks and waste is piling up on the streets.',
  ],
  'Corruption or Misconduct': [
    'Local officials are demanding extra fees for processing routine applications. Citizens are being asked to pay unofficial charges for services that should be free.',
  ],
  'Environmental Concern': [
    'Illegal dumping of industrial waste in our local river is contaminating the water. Fish are dying and people who use the water are getting skin diseases.',
  ],
  'Other': [
    'I would like to report an issue that needs attention from the local authorities. Please review and take appropriate action.',
  ],
};

export default function ReportIssue() {
  const { user } = useAuth();
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);

  const handleAutoFill = () => {
    const randomCategory = issueCategories[Math.floor(Math.random() * issueCategories.length)].value;
    setIssueType(randomCategory);
    
    if (aiDescriptions[randomCategory] && aiDescriptions[randomCategory].length > 0) {
      setDescription(aiDescriptions[randomCategory][0]);
    } else {
      setDescription('Demo description of the issue that needs to be addressed urgently.');
    }
    
    setLocation(locationSuggestions[Math.floor(Math.random() * locationSuggestions.length)]);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!issueType || !description) return;
    setLoading(true);
    try {
      await api.post('/complaints', {
        subject: issueType,
        description: description + (location ? `\n\nLocation: ${location}` : ''),
        category: issueType,
      });
      setSubmitted(true);
    } catch {
      alert('Failed to submit issue. Please try again or log in first.');
    } finally {
      setLoading(false);
    }
  }

  const handleAiCorrect = async () => {
    if (!description.trim()) return;
    setGeneratingAi(true);
    try {
      const res = await api.post('/ai/correct', { text: description, language: 'English' });
      if (res.data.corrected) setDescription(res.data.corrected);
    } catch (err) {
      alert('Failed to correct text');
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleAiImprove = async () => {
    if (!description.trim()) return;
    setGeneratingAi(true);
    try {
      const res = await api.post('/ai/improve', { text: description, type: 'complaint' });
      if (res.data.improved) setDescription(res.data.improved);
    } catch (err) {
      alert('Failed to improve text');
    } finally {
      setGeneratingAi(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link to="/" className="inline-flex items-center gap-2 text-polli-600 hover:text-polli-700 mb-6 text-sm font-medium">
        <ArrowLeft size={16} /> Back to Home
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-amber-100 rounded-lg">
          <AlertTriangle size={24} className="text-amber-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-earth-900">Report an Issue</h1>
          <p className="text-sm text-earth-500">Report problems in your community for quick action</p>
        </div>
      </div>

      {submitted ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✅</span>
          </div>
          <h2 className="text-xl font-semibold text-earth-800 mb-2">Issue Reported Successfully</h2>
          <p className="text-earth-600 mb-4">
            Your report has been submitted. You will be notified when it is reviewed and actioned.
          </p>
          <Link to="/" className="text-polli-600 hover:text-polli-700 font-medium text-sm">
            Return to Home
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {!user && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              You are not logged in. Please{' '}
              <Link to="/login" className="underline font-medium">log in</Link>{' '}
              to submit a report and track its status.
            </div>
          )}

          {/* Category Grid Dropdown */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-earth-700">Issue Type *</label>
              <button 
                type="button" 
                onClick={handleAutoFill}
                className="text-xs px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 rounded-lg font-medium transition flex items-center gap-1 shadow-sm"
              >
                <Sparkles size={12} /> Auto-Fill Demo
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {issueCategories.map(c => (
                <button key={c.value} type="button" onClick={() => setIssueType(c.value)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-colors ${
                    issueType === c.value ? 'border-polli-500 bg-polli-50 ring-2 ring-polli-200' : 'border-earth-200 hover:border-polli-300'
                  }`}>
                  <span className="text-xl">{c.emoji}</span>
                  <span className="text-xs font-medium">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description with AI */}
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1">Description *</label>
            <div className="relative">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={5}
                placeholder="Describe the issue in detail..."
                className="w-full border border-earth-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500"
              />
              {/* Floating AI Action Buttons */}
              {description.trim() && (
                <div className="absolute top-2 right-2 flex flex-col gap-1 z-20">
                  <button onClick={handleAiCorrect} type="button" disabled={generatingAi} className="flex items-center justify-center gap-1 text-[10px] font-bold text-polli-600 bg-polli-50 hover:bg-polli-100 px-2 py-1 rounded transition-colors shadow-sm disabled:opacity-50 border border-polli-200">
                    {generatingAi ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />} Correct
                  </button>
                  <button onClick={handleAiImprove} type="button" disabled={generatingAi} className="flex items-center justify-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded transition-colors shadow-sm disabled:opacity-50 border border-emerald-200">
                    {generatingAi ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />} Improve
                  </button>
                </div>
              )}
            </div>
            {issueType && aiDescriptions[issueType] && (
              <div className="mt-2">
                <button type="button" onClick={() => setShowAi(!showAi)}
                  className="flex items-center gap-1 text-xs text-polli-600 hover:text-polli-700 font-medium">
                  <Sparkles size={12} /> {showAi ? 'Hide' : 'Show'} AI Suggestions
                </button>
                {showAi && (
                  <div className="mt-2 p-3 bg-polli-50 rounded-xl border border-polli-100">
                    <p className="text-xs font-medium text-polli-700 mb-2">💡 AI suggested descriptions:</p>
                    <div className="space-y-1.5">
                      {aiDescriptions[issueType].map((s, i) => (
                        <button key={i} type="button" onClick={() => { setDescription(s); setShowAi(false); }}
                          className="w-full text-left p-2 text-xs text-earth-600 hover:bg-white rounded-md transition-colors border border-transparent hover:border-polli-200">
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Location with dropdown */}
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1">Location</label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-3 text-earth-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Near the primary school, Union 3"
                className="w-full border border-earth-300 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {locationSuggestions.slice(0, 5).map((loc, i) => (
                <button key={i} type="button" onClick={() => setLocation(loc)}
                  className="px-2.5 py-1 rounded-full border border-earth-200 text-[10px] text-earth-500 hover:bg-polli-50 hover:border-polli-300 transition-colors">
                  📍 {loc}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !issueType || !description}
            className="px-6 py-2.5 bg-polli-600 text-white text-sm font-medium rounded-lg hover:bg-polli-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      )}
    </div>
  );
}
