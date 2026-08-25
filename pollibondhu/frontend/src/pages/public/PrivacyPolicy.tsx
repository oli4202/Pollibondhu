import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <Link to="/" className="inline-flex items-center gap-2 text-polli-600 hover:text-polli-700 mb-6 text-sm font-medium">
        <ArrowLeft size={16} /> Back to Home
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-polli-100 rounded-lg">
          <Shield size={24} className="text-polli-600" />
        </div>
        <h1 className="text-3xl font-bold text-earth-900">Privacy Policy</h1>
      </div>

      <p className="text-sm text-earth-500 mb-8">Last updated: August 2026</p>

      <div className="prose prose-earth max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-earth-800 mb-3">1. Information We Collect</h2>
          <p className="text-earth-600 leading-relaxed">
            PolliBondhu collects information that you provide directly, including your name, email address,
            phone number, and location data when you register for an account. We also collect usage data
            such as pages visited, services accessed, and interactions with the platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-earth-800 mb-3">2. How We Use Your Information</h2>
          <ul className="list-disc list-inside text-earth-600 space-y-2">
            <li>To provide and improve our digital services for rural communities</li>
            <li>To process service requests, complaints, and applications</li>
            <li>To connect citizens with government services and NGOs</li>
            <li>To send important notifications about your requests and services</li>
            <li>To ensure platform security and prevent fraud</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-earth-800 mb-3">3. Data Sharing</h2>
          <p className="text-earth-600 leading-relaxed">
            We do not sell your personal data. We may share information with government departments
            and authorised service providers solely to fulfil your service requests and complaints.
            All data sharing complies with Bangladesh's Digital Security Act, 2018.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-earth-800 mb-3">4. Data Security</h2>
          <p className="text-earth-600 leading-relaxed">
            We implement industry-standard security measures including encryption, access controls,
            and regular security audits to protect your personal information from unauthorised access
            or disclosure.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-earth-800 mb-3">5. Your Rights</h2>
          <ul className="list-disc list-inside text-earth-600 space-y-2">
            <li>Access and review your personal data</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your account and data</li>
            <li>Opt out of non-essential communications</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-earth-800 mb-3">6. Contact Us</h2>
          <p className="text-earth-600 leading-relaxed">
            For privacy-related inquiries, please contact us at{' '}
            <span className="text-polli-600 font-medium">privacy@pollibondhu.gov.bd</span> or visit
            your local Union Digital Centre.
          </p>
        </section>
      </div>
    </div>
  );
}
