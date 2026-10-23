'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarClock, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { apiGet, apiWrite } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type Request = { id: string; patientName: string; specialty: string; status: string; consultationMode: string; preferredAt: string | null; scheduledAt: string | null; message: string; sharedSections: string[]; healthDataConsent: boolean; createdAt: string };

export default function DoctorRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [filter, setFilter] = useState('pending');
  const [schedule, setSchedule] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try { setRequests(await apiGet<Request[]>(`/doctor/requests?status=${filter}`)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load consultation requests.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [filter]);

  const respond = async (request: Request, decision: 'accepted' | 'declined') => {
    setBusyId(request.id);
    try {
      const rawSchedule = schedule[request.id];
      const scheduledAt = decision === 'accepted' && rawSchedule ? new Date(rawSchedule).toISOString() : null;
      await apiWrite(`/doctor/requests/${request.id}/response`, 'PUT', { decision, scheduledAt });
      toast.success(decision === 'accepted' ? 'Consultation accepted; secure conversation opened.' : 'Consultation request declined.');
      await load();
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : 'Could not update this request.'); }
    finally { setBusyId(''); }
  };

  return <div className="space-y-6">
    <div><p className="eyebrow">Care coordination</p><h1 className="mt-2 font-display text-2xl font-bold">Consultation requests</h1><p className="mt-1 text-sm text-muted-foreground">Accept or decline patient requests. A secure conversation opens after acceptance.</p></div>
    <div className="flex flex-wrap items-center gap-3"><label htmlFor="request-status" className="text-sm font-medium">Status</label><select id="request-status" value={filter} onChange={(event) => setFilter(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="pending">Pending</option><option value="accepted">Accepted</option><option value="declined">Declined</option></select></div>
    {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
    {loading && <p role="status" className="py-8 text-center text-sm text-muted-foreground">Loading requests...</p>}
    {!loading && !error && requests.length === 0 && <div className="border-y border-dashed border-border py-12 text-center"><h2 className="font-semibold">No {filter} requests</h2><p className="mt-1 text-sm text-muted-foreground">New requests will appear here when a patient contacts you.</p></div>}
    <div className="space-y-3">{requests.map((request) => <Card key={request.id} className="rounded-lg"><CardContent className="space-y-4 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">{request.patientName}</h2><p className="mt-1 text-sm text-muted-foreground">{request.consultationMode === 'in_person' ? 'In person' : 'Online'} consultation · Requested {new Date(request.createdAt).toLocaleString()}</p><p className="mt-1 text-sm text-muted-foreground">Preferred time: {request.preferredAt ? new Date(request.preferredAt).toLocaleString() : 'Not specified'}</p></div><span className="rounded-full border border-border px-3 py-1 text-xs font-medium capitalize">{request.status}</span></div>{request.message && <p className="rounded-md bg-muted/40 p-3 text-sm leading-relaxed">{request.message}</p>}<p className="text-xs text-muted-foreground">Health information shared: {request.healthDataConsent && request.sharedSections.length ? request.sharedSections.join(', ') : 'None'}</p>
      {request.status === 'pending' && <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-end sm:justify-between"><label className="space-y-1 text-xs text-muted-foreground">Propose appointment time (optional)<input type="datetime-local" value={schedule[request.id] ?? ''} onChange={(event) => setSchedule((current) => ({ ...current, [request.id]: event.target.value }))} className="block h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground" /></label><div className="flex gap-2"><Button variant="outline" onClick={() => void respond(request, 'declined')} disabled={busyId === request.id}>Decline</Button><Button onClick={() => void respond(request, 'accepted')} disabled={busyId === request.id}>{busyId === request.id ? 'Saving...' : 'Accept request'}</Button></div></div>}
      {request.status === 'accepted' && <Button size="sm" asChild><Link href="/app/messages"><MessageCircle className="mr-2 h-4 w-4" />Open secure messages</Link></Button>}
      {request.status === 'pending' && <p className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarClock className="h-4 w-4" />Review shared-data consent before opening any health information.</p>}
    </CardContent></Card>)}</div>
  </div>;
}
