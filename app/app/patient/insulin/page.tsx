'use client';

import { Watch, Droplet, Utensils, Zap, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const basalData = Array.from({ length: 24 }, (_, h) => ({
  hour: `${h}:00`,
  rate: 0.8 + Math.sin(h * 0.5) * 0.3,
}));

const bolusEvents = [
  { time: '08:15', type: 'Meal', carbs: 45, units: 4.5, note: 'Breakfast' },
  { time: '12:30', type: 'Meal', carbs: 65, units: 6.0, note: 'Lunch' },
  { time: '15:00', type: 'Correction', carbs: 0, units: 2.0, note: 'High glucose correction' },
  { time: '19:00', type: 'Meal', carbs: 70, units: 6.5, note: 'Dinner' },
  { time: '22:30', type: 'Correction', carbs: 0, units: 1.5, note: 'Pre-bed correction' },
];

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function InsulinPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Insulin &amp; Devices</h1>
        <p className="text-sm text-muted-foreground mt-1">Insulin delivery and connected device data</p>
      </div>

      <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
        <p className="text-xs text-muted-foreground">
          No insulin pump currently connected. Connect your device to enable insulin data integration
          with Synora Intelligence.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total Daily Dose', value: '20.5', unit: 'units', icon: Droplet },
          { label: 'Basal Total', value: '11.0', unit: 'units', icon: Activity },
          { label: 'Bolus Total', value: '9.5', unit: 'units', icon: Zap },
          { label: 'Carb Ratio', value: '1:10', unit: 'g/unit', icon: Utensils },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">{stat.label}</p>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-xl font-bold">{stat.value}</span>
                  <span className="text-xs text-muted-foreground">{stat.unit}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Basal rate chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basal Insulin Rate (24h)</CardTitle>
          <CardDescription>Background insulin delivery profile</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={basalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hour" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" interval={3} />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="rate" fill="hsl(var(--chart-1))" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Bolus events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bolus &amp; Correction Events</CardTitle>
          <CardDescription>Today's insulin delivery log</CardDescription>
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
              {bolusEvents.map((event, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-sm">{event.time}</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${event.type === 'Meal' ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'}`}>
                      {event.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{event.carbs > 0 ? event.carbs : '—'}</TableCell>
                  <TableCell className="text-right font-semibold">{event.units}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{event.note}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Device connection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Connected Devices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Watch className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Insulin Pump</p>
                <p className="text-xs text-muted-foreground">Not connected</p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground border border-border rounded-md px-3 py-1">Connect</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">CGM Sensor</p>
                <p className="text-xs text-success">Connected — active</p>
              </div>
            </div>
            <span className="text-xs text-success">Active</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
