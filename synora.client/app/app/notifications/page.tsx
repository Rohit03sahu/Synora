'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, Check } from 'lucide-react';
import { toast } from 'sonner';
import { apiGet, apiWrite } from '@/lib/api-client';
import { Button } from '@/components/ui/button';

type Notification = { id: string; kind: string; title: string; body: string; resourceId: string | null; createdAt: string; readAt: string | null };

function targetFor(notification: Notification) {
  if (notification.kind === 'doctor_application' || notification.kind === 'doctor_verification') return '/doctor-onboarding';
  if (notification.kind === 'consultation_request') return '/app/doctor/requests';
  if (notification.kind === 'new_message' && notification.resourceId) return `/app/messages/${notification.resourceId}`;
  if (notification.kind === 'conversation_report') return '/app/admin/doctors';
  return '/app/notifications';
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    apiGet<Notification[]>('/doctor/notifications').then(setItems)
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Could not load notifications.'))
      .finally(() => setLoading(false));
  }, []);

  const markRead = async (notification: Notification) => {
    try {
      await apiWrite(`/doctor/notifications/${notification.id}/read`, 'PUT');
      setItems((current) => current.map((item) => item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item));
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : 'Could not update notification.'); }
  };

  return <div className="space-y-6">
    <div><p className="eyebrow">Account updates</p><h1 className="mt-2 font-display text-2xl font-bold">Notifications</h1><p className="mt-1 text-sm text-muted-foreground">Verification updates, consultation requests, and secure message alerts.</p></div>
    {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
    {loading && <p role="status" className="py-8 text-center text-sm text-muted-foreground">Loading notifications...</p>}
    {!loading && !error && items.length === 0 && <div className="border-y border-dashed border-border py-12 text-center"><Bell className="mx-auto h-8 w-8 text-muted-foreground" /><h2 className="mt-3 font-semibold">You are all caught up</h2><p className="mt-1 text-sm text-muted-foreground">New activity will appear here.</p></div>}
    <div className="divide-y divide-border border-y border-border">{items.map((item) => <article key={item.id} className={`flex flex-wrap items-start gap-3 py-4 ${item.readAt ? '' : 'bg-primary/[0.03]'}`}><span className={`mt-2 h-2 w-2 flex-shrink-0 rounded-full ${item.readAt ? 'bg-border' : 'bg-primary'}`} aria-hidden="true" /><div className="min-w-0 flex-1"><h2 className="font-semibold">{item.title}</h2><p className="mt-1 text-sm text-muted-foreground">{item.body}</p><time className="mt-2 block text-xs text-muted-foreground" dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time><Link className="mt-2 inline-block text-sm font-medium text-primary hover:underline" href={targetFor(item)}>View related activity</Link></div>{!item.readAt && <Button variant="ghost" size="sm" onClick={() => void markRead(item)} aria-label={`Mark ${item.title} as read`}><Check className="mr-1 h-4 w-4" />Mark read</Button>}</article>)}</div>
  </div>;
}
