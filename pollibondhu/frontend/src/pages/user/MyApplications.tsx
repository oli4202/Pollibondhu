import { useState, useEffect } from 'react';
import { FileText, ChevronRight, X, Download, UploadCloud, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { ApplicationTimeline } from '@/components/ui/ApplicationTimeline';
import { SkeletonCard } from '@/components/ui/Skeleton';
import api from '@/utils/api';
import { useNavigate } from 'react-router-dom';

interface Application {
  application_id: number;
  tracking_id: string;
  status: string;
  submitted_at: string;
  service?: { title: string } | null;
  documents?: any[];
  updates?: any[];
}

const statusProgress: Record<string, number> = {
  SUBMITTED: 10,
  REVIEWING: 25,
  ADDITIONAL_DOCS_REQUIRED: 30,
  RESUBMITTED: 35,
  IN_PROGRESS: 60,
  APPROVED: 90,
  CLOSED: 100,
  REJECTED: 100,
};

export default function MyApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Application | null>(null);
  const [resubmitMessage, setResubmitMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isResubmitting, setIsResubmitting] = useState(false);
  const navigate = useNavigate();

  const fetchApplications = () => {
    setLoading(true);
    api.get('/applications', { params: { limit: 50 } })
      .then((res) => setApplications(res.data.data?.data || []))
      .catch(() => setApplications([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !resubmitMessage.trim()) return;
    setIsResubmitting(true);
    try {
      await api.post(`/applications/${selected.application_id}/resubmit`, {
        message: resubmitMessage
      });
      setSelected(null);
      setResubmitMessage('');
      setSelectedFile(null);
      fetchApplications();
    } catch (err) {
      console.error(err);
      alert('Failed to resubmit application. Please try again.');
    } finally {
      setIsResubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'My Applications' }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Applications</h1>
          <p className="text-sm text-earth-500 mt-1">Track your government service applications.</p>
        </div>
        <Button size="sm" onClick={() => navigate('/services')}>New Application</Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : applications.length === 0 ? (
        <EmptyState
          icon={<FileText size={48} />}
          title="No applications yet"
          description="Start your first government service application."
          action={<Button onClick={() => navigate('/services')}>Browse Services</Button>}
        />
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <Card
              key={app.application_id}
              className="card-hover cursor-pointer"
              onClick={() => setSelected(app)}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-polli-50 text-polli-600">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">{app.service?.title || 'Service Application'}</h3>
                      <p className="text-xs text-earth-400 mt-0.5 font-mono">
                        {app.tracking_id} · Applied: {new Date(app.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={app.status} />
                    <ChevronRight size={16} className="text-earth-400" />
                  </div>
                </div>
                <div className="mt-3">
                  <ProgressBar value={statusProgress[app.status] || 0} size="sm" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-earth-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[80vh] overflow-auto animate-slide-up">
            <div className="flex items-center justify-between border-b border-earth-200 px-6 py-4 sticky top-0 bg-white">
              <div>
                <h2 className="text-base font-bold">{selected.service?.title || 'Application'}</h2>
                <p className="text-xs text-earth-400 font-mono">{selected.tracking_id}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-earth-400 hover:text-earth-600 p-1">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-4">
                <StatusBadge status={selected.status} />
                <span className="text-xs text-earth-400">
                  Applied: {new Date(selected.submitted_at).toLocaleDateString()}
                </span>
              </div>

              {/* Find the provider's request message */}
              {(() => {
                const docsRequestUpdate = selected.updates?.slice().reverse().find(u => u.new_status === 'ADDITIONAL_DOCS_REQUIRED');
                return (
                  <>
                    <ProgressBar value={statusProgress[selected.status] || 0} showLabel />

              <div className="mt-6">
                <h3 className="text-sm font-bold mb-3">Timeline</h3>
                <ApplicationTimeline events={selected.updates || []} />
              </div>

              {selected.status === 'ADDITIONAL_DOCS_REQUIRED' && (
                <div className="mt-6 border-t border-earth-100 pt-6">
                  <h3 className="text-sm font-bold text-amber-600 mb-3 flex items-center gap-2">
                    Provide Additional Information
                  </h3>
                  
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mb-5 shadow-sm">
                    <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">Provider's Request:</h4>
                    <p className="text-sm text-earth-800 italic font-medium bg-white p-3 rounded-lg border border-amber-100">
                      "{docsRequestUpdate?.comment || "Please provide additional documents or details to process your application."}"
                    </p>
                  </div>

                  <form onSubmit={handleResubmit} className="bg-white p-5 rounded-xl border border-earth-200 shadow-sm">
                    <div className="mb-5">
                      <label className="block text-sm font-bold text-earth-700 mb-2">Upload Document (Optional)</label>
                      <div className="relative border-2 border-dashed border-earth-300 rounded-xl p-6 text-center hover:bg-earth-50 transition-colors">
                        <input 
                          type="file" 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        />
                        {selectedFile ? (
                          <div className="flex flex-col items-center gap-2">
                            <CheckCircle2 size={28} className="text-emerald-500" />
                            <span className="text-sm font-bold text-emerald-700">{selectedFile.name}</span>
                            <span className="text-xs text-earth-500">{(selectedFile.size / 1024).toFixed(2)} KB</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <div className="bg-polli-100 p-3 rounded-full text-polli-600 mb-1">
                              <UploadCloud size={24} />
                            </div>
                            <span className="text-sm font-bold text-earth-700">Click to upload or drag and drop</span>
                            <span className="text-xs text-earth-500">PDF, JPG, PNG (Max 5MB)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-earth-700 mb-2">Message or Details *</label>
                      <textarea 
                        value={resubmitMessage}
                        onChange={(e) => setResubmitMessage(e.target.value)}
                        className="w-full rounded-xl border border-earth-300 p-3 text-sm focus:border-polli-500 focus:ring-2 focus:ring-polli-200 transition-shadow outline-none"
                        rows={3}
                        placeholder="Type any additional details or provide document links here..."
                        required
                      ></textarea>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <Button type="submit" disabled={isResubmitting || !resubmitMessage.trim()} className="bg-polli-600 hover:bg-polli-700 text-white font-bold px-6 shadow-md">
                        {isResubmitting ? 'Submitting...' : 'Submit Information'}
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {selected.documents && selected.documents.filter(d => ['CERTIFICATE', 'PROVIDER_DOCUMENT'].includes(d.doc_type)).length > 0 && (
                <div className="mt-6 border-t border-earth-100 pt-6">
                  <h3 className="text-sm font-bold mb-3">Official Documents</h3>
                  <div className="space-y-3">
                    {selected.documents.filter(d => ['CERTIFICATE', 'PROVIDER_DOCUMENT'].includes(d.doc_type)).map(doc => {
                      const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000';
                      const downloadUrl = doc.file_url.startsWith('blob:') ? doc.file_url : `${baseUrl}${doc.file_url}`;
                      const isCertificate = doc.doc_type === 'CERTIFICATE';
                      
                      return (
                        <div key={doc.document_id} className={`flex items-center justify-between p-4 rounded-xl border ${isCertificate ? 'bg-emerald-50 border-emerald-100' : 'bg-blue-50 border-blue-100'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isCertificate ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                              <FileText size={20} />
                            </div>
                            <div>
                              <p className={`text-sm font-bold ${isCertificate ? 'text-emerald-900' : 'text-blue-900'}`}>{doc.file_name || 'Document'}</p>
                              <p className={`text-xs ${isCertificate ? 'text-emerald-700' : 'text-blue-700'}`}>
                                {isCertificate ? 'Official generated document' : 'Uploaded by Provider'}
                              </p>
                            </div>
                          </div>
                          <a 
                            href={downloadUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            download
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition text-white ${isCertificate ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                          >
                            <Download size={16} />
                            Download
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
