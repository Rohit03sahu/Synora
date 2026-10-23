'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarClock } from 'lucide-react';
import { apiGet } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type Consultation = { id: string; doctorId: string; doctorName: string; specialty: string; status: string; consultationMode: string; preferredAt: string | null; scheduledAt: string | null; message: string; createdAt: string };

export default function PatientRequestsPage() {
  const [requests, setRequests] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { apiGet<Consultation[]>('/doctor/requests').then(setRequests).catch((cause) => setError(cause instanceof Error ? cause.message : 'Could not load requests.')).finally(() => setLoading(false)); }, []);

  return <div className="space-y-6">
    <div><p className="eyebrow">Care requests</p><h1 className="mt-2 font-display text-2xl font-bold">Consultation requests</h1><p className="mt-1 text-sm text-muted-foreground">Track doctor responses and continue accepted conversations.</p></div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {loading && <p role="status" className="py-8 text-center text-sm text-muted-foreground">Loading requests...</p>}
    {!loading && requests.length === 0 && <div className="border-y border-dashed border-border py-12 text-center"><h2 className="font-semibold">No requests yet</h2><p className="mt-1 text-sm text-muted-foreground">Browse the verified directory to request a consultation.</p><Button className="mt-4" asChild><Link href="/app/patient/doctors">Find a Doctor</Link></Button></div>}
    <div className="space-y-3">{requests.map((request) => <Card key={request.id} className="rounded-lg"><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{request.doctorName}</h2><span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium capitalize">{request.status.replace('_', ' ')}</span></div><p className="mt-1 text-sm text-primary">{request.specialty}</p><p className="mt-2 text-xs text-muted-foreground">{request.consultationMode === 'in_person' ? 'In person' : 'Online'}{request.preferredAt ? ` · Preferred ${new Date(request.preferredAt).toLocaleString()}` : ''}{request.scheduledAt ? ` · Scheduled ${new Date(request.scheduledAt).toLocaleString()}` : ''}</p>{request.message && <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{request.message}</p>}</div>{request.status === 'accepted' ? <Button size="sm" asChild><Link href="/app/messages">Open messages <ArrowRight className="ml-2 h-4 w-4" /></Link></Button> : request.status === 'pending' ? <span className="inline-flex items-center gap-2 text-xs text-muted-foreground"><CalendarClock className="h-4 w-4" />Waiting for doctor response</span> : null}</CardContent></Card>)}</div>
  </div>;
}
