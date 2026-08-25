import { Link } from 'react-router-dom';
import { Accessibility as AccessibilityIcon, ArrowLeft } from 'lucide-react';

export default function AccessibilityPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <Link to="/" className="inline-flex items-center gap-2 text-polli-600 hover:text-polli-700 mb-6 text-sm font-medium">
        <ArrowLeft size={16} /> Back to Home
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-polli-100 rounded-lg">
          <AccessibilityIcon size={24} className="text-polli-600" />
        </div>
        <h1 className="text-3xl font-bold text-earth-900">Accessibility</h1>
      </div>

      <div className="prose prose-earth max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-earth-800 mb-3">Our Commitment</h2>
          <p className="text-earth-600 leading-relaxed">
            PolliBondhu is committed to making our platform accessible to all users, including
            people with disabilities. We follow the Web Content Accessibility Guidelines (WCAG) 2.1
            Level AA standards to ensure inclusivity.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-earth-800 mb-3">Accessibility Features</h2>
          <ul className="list-disc list-inside text-earth-600 space-y-2">
            <li>Skip-to-content link for keyboard navigation</li>
            <li>Semantic HTML structure with proper headings</li>
            <li>ARIA labels on interactive elements</li>
            <li>Sufficient colour contrast ratios</li>
            <li>Responsive design for mobile and tablet devices</li>
            <li>Keyboard-navigable menus and forms</li>
            <li>Bengali and English language support</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-earth-800 mb-3">Assistive Technology Support</h2>
          <p className="text-earth-600 leading-relaxed">
            Our platform is designed to work with screen readers, voice recognition software,
            and other assistive technologies. We continuously test with NVDA, JAWS, and VoiceOver.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-earth-800 mb-3">Physical Access Points</h2>
          <p className="text-earth-600 leading-relaxed">
            For citizens who may have difficulty using digital platforms, PolliBondhu services
            are also accessible through Union Digital Centres (UDCs) and Union Parishad offices
            where trained assistants can help you access digital services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-earth-800 mb-3">Feedback & Help</h2>
          <p className="text-earth-600 leading-relaxed">
            If you encounter any accessibility barriers, please let us know at{' '}
            <span className="text-polli-600 font-medium">accessibility@pollibondhu.gov.bd</span>.
            We take all feedback seriously and will work to resolve any issues.
          </p>
        </section>
      </div>
    </div>
  );
}
