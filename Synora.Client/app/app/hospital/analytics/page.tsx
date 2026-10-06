'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useApiData } from '@/hooks/use-api-data';
import type { DashboardOverview } from '@/lib/types';

export default function HospitalAnalyticsPage() {
  const { data, error, loading } = useApiData<DashboardOverview>('/dashboard/overview');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Population health analytics and trends</p>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assessment Trends</CardTitle>
          <CardDescription>Recorded monthly assessment activity for authorized patients</CardDescription>
        </CardHeader>
        <CardContent>
          {(data?.assessmentTrends.length ?? 0) > 0 ? <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data?.assessmentTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
              <Area type="monotone" dataKey="assessed" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.2} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer> : <p className="py-10 text-center text-sm text-muted-foreground">
            {loading ? 'Loading assessment data...' : 'No assessment activity is available.'}
          </p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">HbA1c Distribution</CardTitle>
          <CardDescription>Numeric HbA1c results for authorized patients</CardDescription>
        </CardHeader>
        <CardContent>
          {(data?.hba1cDistribution.length ?? 0) > 0 ? <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data?.hba1cDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="range" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="patients" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer> : <p className="py-10 text-center text-sm text-muted-foreground">
            {loading ? 'Loading laboratory data...' : 'No numeric HbA1c results are available.'}
          </p>}
        </CardContent>
      </Card>
    </div>
  );
}
