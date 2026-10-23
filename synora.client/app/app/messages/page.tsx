'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { apiGet } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';

type Conversation = { id: string; patientName: string; doctorName: string; specialty: string; updatedAt: string; unreadCount: number; lastMessage: string | null };

export default function MessagesPage() {
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const load = () => apiGet<Conversation[]>('/doctor/conversations').then((result) => { if (active) setItems(result); }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Could not load conversations.'); }).finally(() => { if (active) setLoading(false); });
    void load();
    const interval = window.setInterval(load, 8000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  return <div className="space-y-6">
    <div><p className="eyebrow">Secure communication</p><h1 className="mt-2 font-display text-2xl font-bold">Messages</h1><p className="mt-1 text-sm text-muted-foreground">Only participants in an accepted consultation can open its conversation.</p></div>
    {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
    {loading && <p role="status" className="py-8 text-center text-sm text-muted-foreground">Loading conversations...</p>}
    {!loading && items.length === 0 && <div className="border-y border-dashed border-border py-12 text-center"><MessageCircle className="mx-auto h-8 w-8 text-muted-foreground" /><h2 className="mt-3 font-semibold">No active conversations</h2><p className="mt-1 text-sm text-muted-foreground">A conversation opens after a doctor accepts a consultation request.</p></div>}
    <div className="divide-y divide-border border-y border-border">{items.map((item) => <Link key={item.id} href={`/app/messages/${item.id}`} className="flex items-center gap-4 py-4 hover:bg-muted/30"><div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><MessageCircle className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{item.doctorName} <span className="font-normal text-muted-foreground">· {item.specialty}</span></p>{item.unreadCount > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">{item.unreadCount} unread</span>}</div><p className="truncate text-sm text-muted-foreground">{item.lastMessage || 'Conversation started'}</p></div><div className="hidden text-right sm:block"><p className="text-xs text-muted-foreground">{new Date(item.updatedAt).toLocaleString()}</p></div><ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" /></Link>)}</div>
  </div>;
}
