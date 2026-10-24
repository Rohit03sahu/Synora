'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  Clock3,
  Download,
  FileCheck2,
  Languages,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
  UserRoundCheck,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiDownload, apiGet, apiWrite } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

type Application = {
  id: string;
  fullName: string;
  email: string;
  specialty: string;
  qualifications: string;
  registrationNumber: string;
  issuingCouncil: string;
  experienceYears: number;
  affiliation: string;
  status: string;
  submittedAt: string | null;
  reviewNote: string | null;
  documentCount: number;
  phone: string | null;
  biography: string;
  languages: string[];
  clinicAddress: string;
  consultationModes: string[];
  consultationFee: number | null;
};

type Credential = {
  id: string;
  fileName: string;
  contentType: string;
  uploadedAt: string;
  reviewStatus: string;
};

type ReviewTarget = {
  application: Application;
  decision: 'approved' | 'rejected';
};

const filters = [
  { value: 'pending_verification', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All applications' },
];

function formatStatus(status: string) {
  return status.replaceAll('_', ' ');
}

export default function DoctorVerificationPage() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [credentials, setCredentials] = useState<Record<string, Credential[]>>({});
  const [expandedCredentials, setExpandedCredentials] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState('pending_verification');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiGet<Application[]>(
        `/admin/doctors/applications?status=${filter}`,
      );
      setApplications(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load doctor applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!profile || profile.role !== 'platform_admin') {
      router.replace('/app/patient');
      return;
    }
    void load();
  }, [authLoading, filter, profile, router]);

  const openReview = (application: Application, decision: ReviewTarget['decision']) => {
    setReviewNote('');
    setReviewTarget({ application, decision });
  };

  const review = async () => {
    if (!reviewTarget) return;
    const note = reviewNote.trim();
    if (reviewTarget.decision === 'rejected' && !note) {
      toast.error('Add a reason before rejecting this application.');
      return;
    }

    const { application, decision } = reviewTarget;
    setBusyId(application.id);
    try {
      await apiWrite(`/admin/doctors/${application.id}/review`, 'PUT', {
        decision,
        note: note || null,
      });
      toast.success(
        decision === 'approved'
          ? 'Doctor approved and published in the directory.'
          : 'Application rejected and feedback sent to the applicant.',
      );
      setReviewTarget(null);
      await load();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Could not review this application.');
    } finally {
      setBusyId('');
    }
  };

  const toggleCredentials = async (doctorId: string) => {
    if (expandedCredentials[doctorId]) {
      setExpandedCredentials((current) => ({ ...current, [doctorId]: false }));
      return;
    }
    if (credentials[doctorId]) {
      setExpandedCredentials((current) => ({ ...current, [doctorId]: true }));
      return;
    }
    try {
      const result = await apiGet<Credential[]>(`/admin/doctors/${doctorId}/documents`);
      setCredentials((current) => ({ ...current, [doctorId]: result }));
      setExpandedCredentials((current) => ({ ...current, [doctorId]: true }));
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Could not load supporting documents.');
    }
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
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Could not download this document.');
    }
  };

  if (authLoading || !profile || profile.role !== 'platform_admin') {
    return (
      <p role="status" className="p-10 text-center text-sm text-muted-foreground">
        Checking administrator access...
      </p>
    );
  }

  return (
    <div className="space-y-7">
      <header className="flex flex-col justify-between gap-4 rounded-2xl border border-border/70 bg-card p-6 shadow-sm sm:flex-row sm:items-center">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div>
            <p className="eyebrow">Platform administration</p>
            <h1 className="mt-1 font-display text-2xl font-bold">Doctor applications</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Review professional details and supporting documents. Approved doctors become
              visible to patients; rejected applicants receive your feedback.
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh queue
        </Button>
      </header>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-2" aria-label="Filter applications by status">
          {filters.map((item) => (
            <Button
              key={item.value}
              type="button"
              size="sm"
              variant={filter === item.value ? 'default' : 'outline'}
              aria-pressed={filter === item.value}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </Button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {applications.length} application{applications.length === 1 ? '' : 's'}
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}
      {loading && (
        <p role="status" className="py-12 text-center text-sm text-muted-foreground">
          Loading applications...
        </p>
      )}
      {!loading && !error && applications.length === 0 && (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex flex-col items-center py-14 text-center">
            <UserRoundCheck className="h-9 w-9 text-muted-foreground" />
            <h2 className="mt-4 font-semibold">No applications in this view</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              New submissions will appear in the pending queue.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {applications.map((application) => {
          const isPending = application.status === 'pending_verification';
          const isBusy = busyId === application.id;
          return (
            <Card key={application.id} className="overflow-hidden rounded-xl">
              <CardHeader className="border-b border-border/60 bg-muted/20 p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                      {application.fullName.trim().charAt(0).toUpperCase() || '?'}
                    </span>
                    <div>
                      <CardTitle className="text-lg">{application.fullName}</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">{application.email}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
                        <Stethoscope className="h-4 w-4 text-primary" />
                        {application.specialty}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={application.status === 'rejected' ? 'destructive' : application.status === 'approved' ? 'secondary' : 'outline'}
                    className="capitalize"
                  >
                    {application.status === 'pending_verification' && <Clock3 className="mr-1.5 h-3.5 w-3.5" />}
                    {formatStatus(application.status)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-5 p-5 sm:p-6">
                <dl className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Qualifications</dt>
                    <dd className="mt-1">{application.qualifications || 'Not provided'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Medical registration</dt>
                    <dd className="mt-1">{application.registrationNumber} · {application.issuingCouncil}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Experience</dt>
                    <dd className="mt-1">{application.experienceYears} years</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Affiliation</dt>
                    <dd className="mt-1">{application.affiliation || 'Not provided'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Phone</dt>
                    <dd className="mt-1">{application.phone || 'Not provided'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Languages</dt>
                    <dd className="mt-1 flex items-center gap-1.5">
                      <Languages className="h-4 w-4 text-muted-foreground" />
                      {application.languages?.join(', ') || 'Not provided'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Consultation modes</dt>
                    <dd className="mt-1 capitalize">{application.consultationModes?.join(', ').replaceAll('_', ' ') || 'Not provided'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Consultation fee</dt>
                    <dd className="mt-1">{application.consultationFee === null ? 'Not provided' : application.consultationFee}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Submitted</dt>
                    <dd className="mt-1">{application.submittedAt ? new Date(application.submittedAt).toLocaleString() : 'Not submitted'}</dd>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Clinic address</dt>
                    <dd className="mt-1 flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                      {application.clinicAddress || 'Not provided'}
                    </dd>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Professional biography</dt>
                    <dd className="mt-1 whitespace-pre-wrap leading-relaxed">{application.biography || 'Not provided'}</dd>
                  </div>
                  {application.reviewNote && (
                    <div className="sm:col-span-2 lg:col-span-3">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Previous review feedback</dt>
                      <dd className="mt-1">{application.reviewNote}</dd>
                    </div>
                  )}
                </dl>

                <div className="border-t border-border/70 pt-4">
                  {application.documentCount === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No supporting documents submitted. Review the application details before deciding.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <Button type="button" size="sm" variant="outline" onClick={() => void toggleCredentials(application.id)}>
                        <FileCheck2 className="mr-2 h-4 w-4" />
                        {expandedCredentials[application.id] ? 'Hide' : 'Review'} supporting documents ({application.documentCount})
                      </Button>
                      {expandedCredentials[application.id] && credentials[application.id]?.map((document) => (
                        <div key={document.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
                          <div>
                            <p className="text-sm font-medium">{document.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {document.contentType} · {new Date(document.uploadedAt).toLocaleDateString()} · {document.reviewStatus}
                            </p>
                          </div>
                          <Button type="button" variant="ghost" size="sm" onClick={() => void download(application.id, document)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {isPending && (
                  <div className="flex flex-col justify-between gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center">
                    <p className="text-xs text-muted-foreground">
                      Approving publishes this doctor in the patient directory.
                    </p>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => openReview(application, 'rejected')} disabled={isBusy}>
                        <X className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                      <Button type="button" onClick={() => openReview(application, 'approved')} disabled={isBusy}>
                        <Check className="mr-2 h-4 w-4" />
                        Approve and publish
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog
        open={reviewTarget?.decision === 'approved'}
        onOpenChange={(open) => {
          if (!open && !busyId) setReviewTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve this doctor?</AlertDialogTitle>
            <AlertDialogDescription>
              {reviewTarget?.application.fullName} will receive the doctor role and their profile will be published in the patient directory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(busyId)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={Boolean(busyId)}
              onClick={(event) => {
                event.preventDefault();
                void review();
              }}
            >
              {busyId ? 'Approving...' : 'Approve and publish'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={reviewTarget?.decision === 'rejected'}
        onOpenChange={(open) => {
          if (!open && !busyId) setReviewTarget(null);
        }}
      >
        <DialogContent>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void review();
            }}
            className="space-y-5"
          >
            <DialogHeader>
              <DialogTitle>Reject application</DialogTitle>
              <DialogDescription>
                Explain what needs attention. This feedback will be sent to {reviewTarget?.application.fullName}.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              autoFocus
              required
              minLength={3}
              maxLength={1000}
              aria-label="Rejection reason"
              placeholder="Describe why this application cannot be approved yet..."
              value={reviewNote}
              onChange={(event) => setReviewNote(event.target.value)}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setReviewTarget(null)} disabled={Boolean(busyId)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={Boolean(busyId) || reviewNote.trim().length < 3}>
                {busyId ? 'Rejecting...' : 'Reject and send feedback'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
