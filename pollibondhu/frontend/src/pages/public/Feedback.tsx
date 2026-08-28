import { Link } from 'react-router-dom';
import { MessageSquare, ArrowLeft, Star, Sparkles } from 'lucide-react';
import { useState } from 'react';
import api from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

const feedbackTypes = [
  { value: 'General Feedback', label: 'General Feedback', emoji: '💬', desc: 'Share your thoughts' },
  { value: 'Feature Suggestion', label: 'Feature Suggestion', emoji: '💡', desc: 'Suggest new features' },
  { value: 'Bug Report', label: 'Bug Report', emoji: '🐛', desc: 'Report a problem' },
  { value: 'Service Experience', label: 'Service Experience', emoji: '⭐', desc: 'Rate a service' },
  { value: 'Appreciation', label: 'Appreciation', emoji: '🎉', desc: 'Thank someone' },
];

const aiMessages: Record<string, string[]> = {
  'General Feedback': [
    'I have been using PolliBondhu for a few weeks and find it very helpful for staying connected with my community. The agriculture advisory section is particularly useful. I would suggest adding more local language support.',
    'The platform is great for rural communities. However, the loading speed could be improved on slower internet connections. Overall, a valuable service for our village.',
  ],
  'Feature Suggestion': [
    'It would be very helpful to have a direct video calling feature with agriculture officers for real-time crop advice. Many farmers cannot describe problems accurately in text.',
    'I suggest adding an offline mode so we can compose messages and applications when there is no internet, and they get sent automatically when connection is restored.',
    'A marketplace price comparison feature would be great — showing prices from different markets so farmers can decide where to sell their crops for the best price.',
  ],
  'Bug Report': [
    'I am experiencing an issue where the notification bell shows a number but when I click it, there are no new notifications. This happens every few hours. Device: Android phone, Chrome browser.',
    'The application form does not save my progress if I accidentally close the browser. I had to fill everything again from the beginning. Please add auto-save functionality.',
  ],
  'Service Experience': [
    'I recently used the NID correction service through PolliBondhu. The process was smooth and I received my updated NID within 12 days. The online tracking feature was very helpful. Thank you for this wonderful service!',
    'The agriculture officer responded to my crop disease question within 2 hours and provided detailed advice. My paddy crop was saved because of the quick response. Highly recommend this platform to all farmers.',
  ],
  'Appreciation': [
    'I want to thank the PolliBondhu team for creating such a useful platform for our rural community. It has made it so much easier to access government services and stay informed about agricultural best practices.',
    'Special thanks to the agriculture officer who helped me identify and treat blast disease in my paddy field. The advice saved my entire crop. God bless the PolliBondhu team!',
  ],
};

export default function Feedback() {
  const { user } = useAuth();
  const [type, setType] = useState('');
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAi, setShowAi] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!type || !message) return;
    setLoading(true);
    try {
      await api.post('/complaints', {
        subject: `[Feedback] ${type}`,
        description: `Rating: ${'⭐'.repeat(rating)}\n\n${message}`,
        category: 'FEEDBACK',
      });
      setSubmitted(true);
    } catch {
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link to="/" className="inline-flex items-center gap-2 text-polli-600 hover:text-polli-700 mb-6 text-sm font-medium">
        <ArrowLeft size={16} /> Back to Home
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-polli-100 rounded-lg">
          <MessageSquare size={24} className="text-polli-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-earth-900">Feedback</h1>
          <p className="text-sm text-earth-500">Help us improve PolliBondhu with your valuable feedback</p>
        </div>
      </div>

      {submitted ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🎉</span>
          </div>
          <h2 className="text-xl font-semibold text-earth-800 mb-2">Thank You!</h2>
          <p className="text-earth-600 mb-4">
            Your feedback has been submitted successfully. We appreciate you taking the time to help us improve.
          </p>
          <Link to="/" className="text-polli-600 hover:text-polli-700 font-medium text-sm">
            Return to Home
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type Grid Dropdown */}
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-2">Feedback Type *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {feedbackTypes.map(t => (
                <button key={t.value} type="button" onClick={() => setType(t.value)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-colors ${
                    type === t.value ? 'border-polli-500 bg-polli-50 ring-2 ring-polli-200' : 'border-earth-200 hover:border-polli-300'
                  }`}>
                  <span className="text-xl">{t.emoji}</span>
                  <span className="text-xs font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-2">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className={`p-1 transition-colors ${n <= rating ? 'text-amber-400' : 'text-earth-300 hover:text-amber-300'}`}
                >
                  <Star size={28} fill={n <= rating ? 'currentColor' : 'none'} />
                </button>
              ))}
              {rating > 0 && <span className="text-sm text-earth-500 self-center">{rating}/5</span>}
            </div>
          </div>

          {/* Message with AI */}
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1">Your Feedback *</label>
            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
                placeholder="Tell us what you think, suggest improvements, or report an issue..."
                className="w-full border border-earth-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500"
              />
              {type && aiMessages[type] && (
                <button type="button" onClick={() => setShowAi(!showAi)}
                  className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 text-xs text-polli-600 hover:bg-polli-50 rounded-md">
                  <Sparkles size={12} /> AI Suggest
                </button>
              )}
            </div>
            {showAi && type && aiMessages[type] && (
              <div className="mt-2 p-3 bg-polli-50 rounded-xl border border-polli-100">
                <p className="text-xs font-medium text-polli-700 mb-2 flex items-center gap-1"><Sparkles size={12} /> AI suggested feedback:</p>
                <div className="space-y-1.5">
                  {aiMessages[type].map((s, i) => (
                    <button key={i} type="button" onClick={() => { setMessage(s); setShowAi(false); }}
                      className="w-full text-left p-2 text-xs text-earth-600 hover:bg-white rounded-md transition-colors border border-transparent hover:border-polli-200">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !type || !message}
            className="px-6 py-2.5 bg-polli-600 text-white text-sm font-medium rounded-lg hover:bg-polli-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      )}
    </div>
  );
}
