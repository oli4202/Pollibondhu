import { Link } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';

export default function TermsOfUse() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <Link to="/" className="inline-flex items-center gap-2 text-polli-600 hover:text-polli-700 mb-6 text-sm font-medium">
        <ArrowLeft size={16} /> Back to Home
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-polli-100 rounded-lg">
          <FileText size={24} className="text-polli-600" />
        </div>
        <h1 className="text-3xl font-bold text-earth-900">Terms of Use</h1>
      </div>

      <p className="text-sm text-earth-500 mb-8">Last updated: August 2026</p>

      <div className="prose prose-earth max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-earth-800 mb-3">1. Acceptance of Terms</h2>
          <p className="text-earth-600 leading-relaxed">
            By accessing or using PolliBondhu, you agree to be bound by these Terms of Use.
            If you do not agree, please do not use the platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-earth-800 mb-3">2. Eligibility</h2>
          <p className="text-earth-600 leading-relaxed">
            The platform is available to all residents of Bangladesh. Users under 18 must have
            parental or guardian consent to register.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-earth-800 mb-3">3. User Responsibilities</h2>
          <ul className="list-disc list-inside text-earth-600 space-y-2">
            <li>Provide accurate and truthful information when registering</li>
            <li>Keep your account credentials secure</li>
            <li>Use the platform only for lawful purposes</li>
            <li>Do not attempt to manipulate or abuse services</li>
            <li>Report any suspicious activity immediately</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-earth-800 mb-3">4. Service Availability</h2>
          <p className="text-earth-600 leading-relaxed">
            We strive to keep the platform available at all times, but we do not guarantee
            uninterrupted access. Scheduled maintenance will be announced in advance.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-earth-800 mb-3">5. Limitation of Liability</h2>
          <p className="text-earth-600 leading-relaxed">
            PolliBondhu is a digital facilitation platform. We connect citizens with government
            services and are not the direct provider of those services. The government department
            or service provider is responsible for service delivery.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-earth-800 mb-3">6. Termination</h2>
          <p className="text-earth-600 leading-relaxed">
            We reserve the right to suspend or terminate accounts that violate these terms or
            engage in fraudulent or harmful activity.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-earth-800 mb-3">7. Changes to Terms</h2>
          <p className="text-earth-600 leading-relaxed">
            We may update these terms from time to time. Users will be notified of significant
            changes through the platform or via email.
          </p>
        </section>
      </div>
    </div>
  );
}
