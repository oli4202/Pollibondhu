import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const faqs = [
  {
    q: 'How do I register on PolliBondhu?',
    a: 'Click the Register button on the homepage. Fill in your name, email, phone number, and password. You will receive a confirmation and can start using the platform immediately.',
  },
  {
    q: 'How do I submit a complaint?',
    a: 'Log in to your dashboard and go to "Complaints". Click "New Complaint", fill in the details including category, description, and location, then submit. You will receive a tracking number.',
  },
  {
    q: 'How do I apply for a government service?',
    a: 'Browse the Services page, find the service you need, and click "Apply". Fill in the required information and upload necessary documents. Track your application status from your dashboard.',
  },
  {
    q: 'How can I check the status of my application?',
    a: 'Log in to your dashboard and navigate to "My Applications". Each application shows its current status: Submitted, Under Review, Approved, or Rejected.',
  },
  {
    q: 'I forgot my password. How do I reset it?',
    a: 'Click "Login" and then "Forgot Password". Enter your registered email address and follow the instructions sent to your inbox.',
  },
  {
    q: 'How do I contact a government department?',
    a: 'Use the Contact Us page to find department contact details. You can also use the messaging feature in your dashboard to communicate directly with assigned officers.',
  },
  {
    q: 'Is PolliBondhu free to use?',
    a: 'Yes, PolliBondhu is completely free for all citizens. There are no charges for registration, submitting complaints, or applying for government services.',
  },
  {
    q: 'Can I use PolliBondhu in Bengali?',
    a: 'Yes, the platform supports both Bengali and English. You can switch languages from the settings in your dashboard.',
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-earth-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-earth-50 transition-colors"
      >
        <span className="font-medium text-earth-800">{q}</span>
        <ChevronDown size={18} className={`text-earth-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-4 text-earth-600 text-sm leading-relaxed">{a}</div>
      )}
    </div>
  );
}

export default function HelpCenter() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <Link to="/" className="inline-flex items-center gap-2 text-polli-600 hover:text-polli-700 mb-6 text-sm font-medium">
        <ArrowLeft size={16} /> Back to Home
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-polli-100 rounded-lg">
          <HelpCircle size={24} className="text-polli-600" />
        </div>
        <h1 className="text-3xl font-bold text-earth-900">Help Center</h1>
      </div>

      <p className="text-earth-600 mb-8">
        Find answers to commonly asked questions about using PolliBondhu.
      </p>

      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <FaqItem key={i} q={faq.q} a={faq.a} />
        ))}
      </div>

      <div className="mt-10 p-6 bg-polli-50 border border-polli-200 rounded-xl">
        <h2 className="text-lg font-semibold text-earth-800 mb-2">Still need help?</h2>
        <p className="text-earth-600 text-sm mb-4">
          Our support team is available to assist you with any issues.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/contact"
            className="px-4 py-2 bg-polli-600 text-white text-sm font-medium rounded-lg hover:bg-polli-700 transition-colors"
          >
            Contact Us
          </Link>
          <Link
            to="/community"
            className="px-4 py-2 border border-polli-300 text-polli-700 text-sm font-medium rounded-lg hover:bg-polli-50 transition-colors"
          >
            Visit Community
          </Link>
        </div>
      </div>
    </div>
  );
}
