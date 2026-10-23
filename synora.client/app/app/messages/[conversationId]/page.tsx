'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, FileText, Flag, LockKeyhole, Send, ShieldOff } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { apiGet, apiSend, apiWrite } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

type Message = { id: string; senderId: string; body: string; createdAt: string; readAt: string | null };
type Conversation = { id: string; patientId: string; patientName: string; doctorId: string; doctorName: string; specialty: string; updatedAt: string; unreadCount: number; lastMessage: string | null; requestId: string };
type Request = { id: string; sharedSections: string[]; healthDataConsent: boolean };
const sharedItems = [
  { id: 'questionnaire', label: 'Health questionnaire' }, { id: 'labs', label: 'Laboratory results' },
  { id: 'cgm', label: 'CGM readings' }, { id: 'insulin', label: 'Insulin information' },
  { id: 'genomics', label: 'Genomic data' }, { id: 'assessments', label: 'Recorded assessments' },
];

export default function ConversationPage() {
  const params = useParams<{ conversationId: string }>();
  const { user, profile } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [request, setRequest] = useState<Request | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sharedRecord, setSharedRecord] = useState<Record<string, unknown> | null>(null);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [savingConsent, setSavingConsent] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const isPatient = profile?.role === 'patient';

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const all = await apiGet<Conversation[]>('/doctor/conversations');
        const current = all.find((item) => item.id === params.conversationId);
        if (!current) throw new Error('Conversation is not available to this account.');
        if (active) setConversation(current);
        const [thread, requests] = await Promise.all([
          apiGet<Message[]>(`/doctor/conversations/${params.conversationId}/messages`),
          apiGet<Request[]>('/doctor/requests?status=accepted'),
        ]);
        if (active) {
          setMessages(thread);
          const matching = requests.find((item) => item.id === current.requestId);
          if (matching) {
            setRequest(matching);
            setSelectedSections(matching.sharedSections);
            setConsent(matching.healthDataConsent);
          }
          setError('');
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Could not load this conversation.');
      } finally { if (active) setLoading(false); }
    };
    void load();
    const interval = window.setInterval(() => {
      apiGet<Message[]>(`/doctor/conversations/${params.conversationId}/messages`).then((thread) => { if (active) setMessages(thread); }).catch(() => undefined);
    }, 4000);
    return () => { active = false; window.clearInterval(interval); };
  }, [params.conversationId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages]);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    try {
      const sent = await apiSend<Message>(`/doctor/conversations/${params.conversationId}/messages`, { body: body.trim() });
      setMessages((current) => [...current, sent]);
      setBody('');
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : 'Could not send message.'); }
    finally { setSending(false); }
  };

  const loadRecord = async () => {
    setLoadingRecord(true);
    try { setSharedRecord(await apiGet<Record<string, unknown>>(`/doctor/conversations/${params.conversationId}/shared-record`)); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : 'Could not open shared information.'); }
    finally { setLoadingRecord(false); }
  };

  const saveSharing = async () => {
    if (!request) return;
    setSavingConsent(true);
    try {
      await apiWrite(`/doctor/requests/${request.id}/sharing`, 'PUT', { sharedSections: selectedSections, healthDataConsent: consent });
      setRequest({ ...request, sharedSections: selectedSections, healthDataConsent: consent });
      setSharedRecord(null);
      toast.success(consent ? 'Sharing permissions updated' : 'Health-data sharing withdrawn');
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : 'Could not update permissions.'); }
    finally { setSavingConsent(false); }
  };

  const block = async () => {
    if (!window.confirm('Block further messages in this conversation?')) return;
    try { await apiWrite(`/doctor/conversations/${params.conversationId}/block`, 'POST'); setError('This conversation is blocked.'); toast.success('Conversation blocked'); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : 'Could not block the conversation.'); }
  };

  const report = async () => {
    const reason = window.prompt('Tell us why you are reporting this conversation.');
    if (!reason?.trim()) return;
    try { await apiSend(`/doctor/conversations/${params.conversationId}/report`, { reason }); toast.success('Report submitted for review'); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : 'Could not submit report.'); }
  };

  if (loading) return <p role="status" className="py-12 text-center text-sm text-muted-foreground">Loading secure conversation...</p>;
  if (error || !conversation) return <div className="space-y-4"><p role="alert" className="text-sm text-destructive">{error || 'Conversation not found.'}</p><Button variant="outline" asChild><Link href="/app/messages"><ArrowLeft className="mr-2 h-4 w-4" />Back to messages</Link></Button></div>;

  const otherName = isPatient ? conversation.doctorName : conversation.patientName;
  return <div className="mx-auto grid max-w-6xl gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
    <section className="flex min-h-[70vh] flex-col overflow-hidden rounded-lg border border-border bg-card">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-6"><div className="min-w-0"><Button variant="ghost" size="sm" asChild><Link href="/app/messages"><ArrowLeft className="mr-2 h-4 w-4" />Messages</Link></Button><h1 className="mt-2 truncate font-semibold">{otherName}</h1><p className="text-xs text-muted-foreground">{isPatient ? conversation.specialty : 'Patient'} · Secure consultation</p></div><LockKeyhole className="h-5 w-5 flex-shrink-0 text-success" aria-label="Secure conversation" /></header>
      <div className="flex-1 space-y-4 overflow-y-auto bg-muted/20 p-4 sm:p-6" aria-live="polite">
        {messages.map((message) => {
          const own = message.senderId === user?.id;
          return <div key={message.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] rounded-lg border px-4 py-3 sm:max-w-[75%] ${own ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card'}`}><p className="whitespace-pre-wrap break-words text-sm">{message.body}</p><div className={`mt-2 flex justify-end gap-2 text-[11px] ${own ? 'text-primary-foreground/75' : 'text-muted-foreground'}`}><time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString()}</time>{own && <span>{message.readAt ? 'Read' : 'Sent'}</span>}</div></div></div>;
        })}
        {messages.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">Conversation is ready. Send a message to begin.</p>}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="flex items-end gap-2 border-t border-border p-3 sm:p-4"><Textarea aria-label="Write a secure message" value={body} onChange={(event) => setBody(event.target.value)} maxLength={4000} rows={2} placeholder="Write a message..." /><Button type="submit" size="icon" aria-label="Send message" title="Send message" disabled={sending || !body.trim()}><Send className="h-4 w-4" /></Button></form>
    </section>
    <aside className="space-y-4">
      {isPatient && request && <section className="space-y-3 rounded-lg border border-border bg-card p-4"><div><h2 className="font-semibold">Shared information</h2><p className="mt-1 text-xs text-muted-foreground">Choose categories and consent to share them with this doctor.</p></div>{sharedItems.map((item) => <label key={item.id} className="flex cursor-pointer items-start gap-2 text-sm"><Checkbox checked={selectedSections.includes(item.id)} onCheckedChange={(checked) => setSelectedSections((current) => checked ? [...current, item.id] : current.filter((value) => value !== item.id))} />{item.label}</label>)}<label className="flex cursor-pointer items-start gap-2 border-t border-border pt-3 text-xs leading-relaxed"><Checkbox checked={consent} onCheckedChange={(checked) => setConsent(checked === true)} />I authorize access to the selected health information.</label><Button size="sm" className="w-full" onClick={saveSharing} disabled={savingConsent || (selectedSections.length > 0 && !consent)}>{savingConsent ? 'Saving...' : 'Save sharing permissions'}</Button></section>}
      <section className="space-y-3 rounded-lg border border-border bg-card p-4"><div><h2 className="font-semibold">Consultation information</h2><p className="mt-1 text-xs text-muted-foreground">Shared only when the patient authorizes it.</p></div><Button variant="outline" size="sm" className="w-full" onClick={loadRecord} disabled={loadingRecord}><FileText className="mr-2 h-4 w-4" />{loadingRecord ? 'Loading...' : 'Review shared health record'}</Button>{sharedRecord && <pre className="max-h-72 overflow-auto rounded-md bg-muted p-3 text-xs leading-relaxed">{JSON.stringify(sharedRecord, null, 2)}</pre>}<p className="text-xs leading-relaxed text-muted-foreground">Recorded assessments are decision-support information, not a confirmed diagnosis.</p></section>
      <section className="flex gap-2"><Button variant="outline" size="sm" onClick={report} className="flex-1"><Flag className="mr-2 h-3.5 w-3.5" />Report</Button><Button variant="outline" size="sm" onClick={block} className="flex-1"><ShieldOff className="mr-2 h-3.5 w-3.5" />Block</Button></section>
    </aside>
  </div>;
}
