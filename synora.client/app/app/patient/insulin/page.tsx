'use client';

import { Activity, Droplet, Utensils, Watch, Zap } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApiData } from '@/hooks/use-api-data';

interface InsulinData {
  events: {
    id: string;
    recordedAt: string;
    eventType: string;
    carbsGrams: number | null;
    units: number;
    note: string;
    source: string;
  }[];
  basalRates: { hourOfDay: number; rateUnitsPerHour: number; source: string }[];
}

interface Device {
  id: string;
  provider: string;
  deviceType: string;
  displayName: string;
  status: 'pending' | 'connected' | 'disconnected' | 'error';
  lastSyncedAt: string | null;
}

export default function InsulinPage() {
  const { data, error, loading } = useApiData<InsulinData>('/insulin');
  const { data: devices } = useApiData<Device[]>('/devices');
  const now = new Date();
  const todaysEvents = (data?.events ?? []).filter((event) =>
    new Date(event.recordedAt).toDateString() === now.toDateString());
  const basalRates = Array.from({ length: 24 }, (_, hour) => {
    const rate = data?.basalRates.find((item) => item.hourOfDay === hour);
    return { hour: `${String(hour).padStart(2, '0')}:00`, rate: rate?.rateUnitsPerHour ?? 0 };
  });
  const basalTotal = data?.basalRates.reduce((total, item) => total + item.rateUnitsPerHour, 0) ?? 0;
  const bolusTotal = todaysEvents
    .filter((event) => event.eventType !== 'basal')
    .reduce((total, event) => total + event.units, 0);
  const connectedDevices = (devices ?? []).filter((device) => device.status === 'connected');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Insulin &amp; Devices</h1>
        <p className="mt-1 text-sm text-muted-foreground">Insulin delivery and connected device data</p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}
      {!loading && !error && connectedDevices.length === 0 && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 text-xs text-muted-foreground">
          No insulin pump is connected. Device readings appear here after a provider integration has been authorized and synchronized.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total Daily Dose', value: (basalTotal + bolusTotal).toFixed(1), unit: 'units', icon: Droplet },
          { label: 'Basal Total', value: basalTotal.toFixed(1), unit: 'units/day', icon: Activity },
          { label: 'Bolus Total', value: bolusTotal.toFixed(1), unit: 'units today', icon: Zap },
          { label: 'Carb Ratio', value: '—', unit: 'not recorded', icon: Utensils },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="pt-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{stat.label}</p>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-xl font-bold">{loading ? '—' : stat.value}</span>
                  <span className="text-xs text-muted-foreground">{stat.unit}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basal Insulin Rate (24h)</CardTitle>
          <CardDescription>Background insulin delivery profile, when recorded</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.basalRates.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={basalRates}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" interval={3} />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="rate" fill="hsl(var(--chart-1))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No basal rate profile has been recorded.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bolus &amp; Correction Events</CardTitle>
          <CardDescription>Insulin delivery events recorded today</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Carbs (g)</TableHead>
                <TableHead className="text-right">Units</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {todaysEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-mono text-sm">
                    {new Date(event.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                  <TableCell className="capitalize">{event.eventType}</TableCell>
                  <TableCell className="text-right">{event.carbsGrams ?? '—'}</TableCell>
                  <TableCell className="text-right font-semibold">{event.units}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{event.note || '—'}</TableCell>
                </TableRow>
              ))}
              {!loading && todaysEvents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    No insulin events have been recorded today.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Connected Devices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(devices ?? []).map((device) => (
            <div key={device.id} className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Watch className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">{device.displayName}</p>
                  <p className="text-xs capitalize text-muted-foreground">{device.provider} · {device.status}</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {device.lastSyncedAt ? `Synced ${new Date(device.lastSyncedAt).toLocaleDateString()}` : 'Not synced'}
              </span>
            </div>
          ))}
          {!devices?.length && (
            <p className="text-sm text-muted-foreground">No device connections have been requested.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
