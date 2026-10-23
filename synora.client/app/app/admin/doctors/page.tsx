'use client';

import { useEffect, useState } from 'react';
import { Download, FileCheck2, RefreshCw, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { apiDownload, apiGet, apiWrite } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

type Application = {
  id: string; fullName: string; email: string; specialty: string; qualifications: string;
  registrationNumber: string; issuingCouncil: string; experienceYears: number; affiliation: string;
  status: string; submittedAt: string | null; reviewNote: string | null; documentCount: number;
};
type Credential = { id: string; fileName: string; contentType: string; uploadedAt: string; reviewStatus: string };

export default function DoctorVerificationPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [credentials, setCredentials] = useState<Record<string, Credential[]>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState('pending_verification');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiGet<Application[]>(`/admin/doctors/applications?status=${filter}`);
      setApplications(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load doctor applications.');
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [filter]);

  const loadCredentials = async (doctorId: string) => {
    try {
      const result = await apiGet<Credential[]>(`/admin/doctors/${doctorId}/documents`);
      setCredentials((current) => ({ ...current, [doctorId]: result }));
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : 'Could not load credential documents.'); }
  };

  const download = async (doctorId: string, credential: Credential) => {
    try {
      const blob = await apiDownload(`/admin/doctors/${doctorId}/documents/${credential.id}`);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = credential.fileName;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : 'Could not download this document.'); }
  };

  const review = async (application: Application, decision: 'approved' | 'rejected') => {
    const note = notes[application.id]?.trim() ?? '';
    if (decision === 'rejected' && !note) { toast.error('Add a review note before rejecting.'); return; }
    setBusyId(application.id);
    try {
      await apiWrite(`/admin/doctors/${application.id}/review`, 'PUT', { decision, note: note || null });
      toast.success(decision === 'approved' ? 'Doctor approved and listed in the directory.' : 'Application rejected.');
      await load();
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : 'Could not review this application.'); }
    finally { setBusyId(''); }
  };

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Platform administration</p><h1 className="mt-2 font-display text-2xl font-bold">Doctor verification</h1><p className="mt-1 text-sm text-muted-foreground">Review submitted credentials before listing a clinician in Find a Doctor.</p></div><Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Refresh queue</Button></div>
    <div className="flex flex-wrap items-center gap-3"><label htmlFor="application-filter" className="text-sm font-medium">Application status</label><select id="application-filter" value={filter} onChange={(event) => setFilter(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="pending_verification">Pending verification</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="draft">Draft</option><option value="all">All statuses</option></select><span className="text-xs text-muted-foreground">{applications.length} application{applications.length === 1 ? '' : 's'}</span></div>
    {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
    {loading && <p role="status" className="py-8 text-center text-sm text-muted-foreground">Loading applications...</p>}
    {!loading && !error && applications.length === 0 && <div className="border-y border-dashed border-border py-12 text-center"><ShieldCheck className="mx-auto h-8 w-8 text-muted-foreground" /><h2 className="mt-3 font-semibold">No applications in this view</h2><p className="mt-1 text-sm text-muted-foreground">New submissions will appear here for credential review.</p></div>}
    <div className="space-y-4">{applications.map((application) => <Card key={application.id} className="rounded-lg"><CardHeader className="pb-3"><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle className="text-base">{application.fullName}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{application.email} · {application.specialty}</p></div><span className="rounded-full border border-border px-3 py-1 text-xs font-medium capitalize">{application.status.replaceAll('_', ' ')}</span></div></CardHeader><CardContent className="space-y-4"><dl className="grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-xs text-muted-foreground">Qualifications</dt><dd>{application.qualifications}</dd></div><div><dt className="text-xs text-muted-foreground">Registration</dt><dd>{application.registrationNumber} · {application.issuingCouncil}</dd></div><div><dt className="text-xs text-muted-foreground">Experience</dt><dd>{application.experienceYears} years</dd></div><div><dt className="text-xs text-muted-foreground">Affiliation</dt><dd>{application.affiliation || 'Not provided'}</dd></div><div><dt className="text-xs text-muted-foreground">Submitted</dt><dd>{application.submittedAt ? new Date(application.submittedAt).toLocaleString() : 'Not submitted'}</dd></div></dl>
      <div className="space-y-2 border-t border-border pt-4"><Button type="button" variant="outline" size="sm" onClick={() => void loadCredentials(application.id)}><FileCheck2 className="mr-2 h-4 w-4" />{credentials[application.id] ? 'Refresh credentials' : `Review credentials (${application.documentCount})`}</Button>{credentials[application.id]?.map((document) => <div key={document.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"><div><p className="text-sm font-medium">{document.fileName}</p><p className="text-xs text-muted-foreground">{document.contentType} · {new Date(document.uploadedAt).toLocaleDateString()} · {document.reviewStatus}</p></div><Button variant="ghost" size="sm" onClick={() => void download(application.id, document)}><Download className="mr-2 h-4 w-4" />Download</Button></div>)}</div>
      {application.status === 'pending_verification' && <div className="space-y-3 border-t border-border pt-4"><Textarea aria-label={`Review note for ${application.fullName}`} placeholder="Required when rejecting; optional when approving." maxLength={1000} value={notes[application.id] ?? ''} onChange={(event) => setNotes((current) => ({ ...current, [application.id]: event.target.value }))} /><div className="flex flex-wrap justify-end gap-2"><Button variant="outline" onClick={() => void review(application, 'rejected')} disabled={busyId === application.id}>{busyId === application.id ? 'Saving...' : 'Reject application'}</Button><Button onClick={() => void review(application, 'approved')} disabled={busyId === application.id}>{busyId === application.id ? 'Saving...' : 'Approve and publish'}</Button></div></div>}
    </CardContent></Card>)}</div>
  </div>;
}
