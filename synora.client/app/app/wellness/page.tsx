'use client';

import { useApiData } from '@/hooks/use-api-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DashboardOverview } from '@/lib/types';

export default function WellnessDashboard() {
  const { data, error, loading } = useApiData<DashboardOverview>('/dashboard/overview');
  const stats = [
    { label: 'Members', value: data?.stats.members },
    { label: 'Members with assessments', value: data?.stats.assessedPatients },
    { label: 'Data completeness', value: data ? `${data.stats.dataCompleteness}%` : undefined },
    { label: 'CGM adoption', value: data ? `${data.stats.cgmAdoption}%` : undefined },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">GenoGluco Wellness</h1>
        <p className="mt-1 text-sm text-muted-foreground">Aggregated records for your authorized organization.</p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold">{stat.value ?? (loading ? '...' : '—')}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <p className="text-xs text-muted-foreground">
          Individual health information is not exposed to organizations without appropriate authorization
          and consent. These charts use data aggregated by the API and do not provide clinical recommendations.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recorded assessment distribution</CardTitle>
            <CardDescription>Latest recorded assessment for shared members</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.riskDistribution.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.riskDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Bar dataKey="value" name="Members" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">
                {loading ? 'Loading assessment data...' : 'No assessment data is available.'}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assessment activity</CardTitle>
            <CardDescription>Number of recorded assessments by month</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.assessmentTrends.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.assessmentTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Bar dataKey="assessed" name="Assessments" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">
                {loading ? 'Loading assessment activity...' : 'No assessment activity is available.'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recorded HbA1c values</CardTitle>
          <CardDescription>Distribution of stored HbA1c results across authorized members</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.hba1cDistribution.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.hba1cDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Bar dataKey="patients" name="Members" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {loading ? 'Loading HbA1c records...' : 'No HbA1c results are available.'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
