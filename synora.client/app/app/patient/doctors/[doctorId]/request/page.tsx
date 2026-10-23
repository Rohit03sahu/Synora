'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { apiSend } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const shareOptions = [
  { id: 'questionnaire', label: 'Diabetes history and patient questionnaire' },
  { id: 'labs', label: 'Laboratory reports and HbA1c results' },
  { id: 'cgm', label: 'CGM readings and glucose trends' },
  { id: 'insulin', label: 'Insulin pump and insulin-event information' },
  { id: 'genomics', label: 'Genomic information' },
  { id: 'assessments', label: 'Recorded assessments and explanations' },
];

export default function ConsultationRequestPage() {
  const params = useParams<{ doctorId: string }>();
  const router = useRouter();
  const [mode, setMode] = useState('online');
  const [preferredAt, setPreferredAt] = useState('');
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [consented, setConsented] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toggle = (section: string, checked: boolean) => {
    setSelected((current) => checked ? [...current, section] : current.filter((item) => item !== section));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (selected.length > 0 && !consented) return;
    setSubmitting(true);
    try {
      const request = await apiSend<{ id: string }>('/doctor/requests', {
        doctorId: params.doctorId,
        consultationMode: mode,
        preferredAt: preferredAt ? new Date(preferredAt).toISOString() : null,
        message: message.trim(),
        sharedSections: selected,
        healthDataConsent: consented,
      });
      toast.success('Consultation request sent');
      router.push(`/app/patient/requests?created=${request.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not send the consultation request.');
      setSubmitting(false);
    }
  };

  return <div className="mx-auto max-w-3xl space-y-5">
    <Button variant="ghost" size="sm" asChild><Link href={`/app/patient/doctors/${params.doctorId}`}><ArrowLeft className="mr-2 h-4 w-4" />Back to doctor profile</Link></Button>
    <div><p className="eyebrow">Consultation request</p><h1 className="mt-2 font-display text-2xl font-bold tracking-tight">Choose a time and what to share.</h1><p className="mt-1 text-sm text-muted-foreground">The doctor will review your request before a conversation is opened.</p></div>
    <form onSubmit={submit} className="space-y-5">
      <Card className="rounded-lg"><CardHeader><CardTitle className="text-base">Consultation details</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="mode">Consultation mode</Label><select id="mode" value={mode} onChange={(event) => setMode(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="online">Online</option><option value="in_person">In person</option></select></div>
        <div className="space-y-2"><Label htmlFor="preferred">Preferred date and time (optional)</Label><Input id="preferred" type="datetime-local" value={preferredAt} onChange={(event) => setPreferredAt(event.target.value)} /></div>
        <div className="space-y-2 sm:col-span-2"><Label htmlFor="message">Message to the doctor (optional)</Label><Textarea id="message" maxLength={2000} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="What would you like help discussing?" /><p className="text-right text-xs text-muted-foreground">{message.length}/2000</p></div>
      </CardContent></Card>
      <Card className="rounded-lg"><CardHeader><div className="flex gap-3"><ShieldCheck className="h-5 w-5 text-primary" /><div><CardTitle className="text-base">Health information to share</CardTitle><p className="mt-1 text-sm font-normal text-muted-foreground">Nothing is shared unless you select it. You can change permission later.</p></div></div></CardHeader><CardContent className="space-y-3">
        {shareOptions.map((option) => <label key={option.id} className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3"><Checkbox checked={selected.includes(option.id)} onCheckedChange={(value) => toggle(option.id, value === true)} /><span className="text-sm">{option.label}</span></label>)}
        {selected.length > 0 && <label className="flex cursor-pointer items-start gap-3 rounded-md border border-primary/30 bg-primary/5 p-4"><Checkbox checked={consented} onCheckedChange={(value) => setConsented(value === true)} /><span className="text-sm leading-relaxed">I authorize this doctor to view the selected health information for this consultation. I understand I can withdraw this permission.</span></label>}
        <p className="text-xs leading-relaxed text-muted-foreground">Shared assessments are decision-support records, not confirmed diagnoses. The doctor can review only the categories you select here.</p>
      </CardContent></Card>
      <Button type="submit" disabled={submitting || (selected.length > 0 && !consented)}>{submitting ? 'Sending request...' : 'Send consultation request'}</Button>
    </form>
  </div>;
}
