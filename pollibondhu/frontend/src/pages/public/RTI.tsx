import { Link } from 'react-router-dom';
import { BookOpen, ArrowLeft } from 'lucide-react';

export default function RTI() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <Link to="/" className="inline-flex items-center gap-2 text-polli-600 hover:text-polli-700 mb-6 text-sm font-medium">
        <ArrowLeft size={16} /> Back to Home
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-polli-100 rounded-lg">
          <BookOpen size={24} className="text-polli-600" />
        </div>
        <h1 className="text-3xl font-bold text-earth-900">Right to Information (RTI)</h1>
      </div>

      <div className="prose prose-earth max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-earth-800 mb-3">About RTI</h2>
          <p className="text-earth-600 leading-relaxed">
            The Right to Information Act, 2009 empowers every citizen of Bangladesh to request
            information from public bodies. PolliBondhu supports transparency by facilitating
            RTI requests through our digital platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-earth-800 mb-3">How to File an RTI Request</h2>
          <ul className="list-disc list-inside text-earth-600 space-y-2">
            <li>Log in to your PolliBondhu account</li>
            <li>Navigate to the Community section and submit a request</li>
            <li>Select the relevant government department</li>
            <li>Describe the information you are seeking</li>
            <li>Submit the request — you will receive a tracking number</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-earth-800 mb-3">Timeline</h2>
          <p className="text-earth-600 leading-relaxed">
            Government departments are required to respond to RTI requests within 20 working days.
            If the response is unsatisfactory, you may file an appeal with the Information Commission.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-earth-800 mb-3">Exemptions</h2>
          <p className="text-earth-600 leading-relaxed">
            Certain categories of information may be exempt from disclosure, including classified
            national security information, trade secrets, and personal privacy data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-earth-800 mb-3">Need Help?</h2>
          <p className="text-earth-600 leading-relaxed">
            For assistance with RTI requests, contact the Information Commission at{' '}
            <span className="text-polli-600 font-medium">info commission.gov.bd</span> or visit
            your local Union Digital Centre for free support.
          </p>
        </section>
      </div>
    </div>
  );
}
