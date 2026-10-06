'use client';

import { Brain } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useApiData } from '@/hooks/use-api-data';
import type { DashboardOverview } from '@/lib/types';

export default function WellnessInsightsPage() {
  const { data, error, loading } = useApiData<DashboardOverview>('/dashboard/overview');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Organization Data Summary</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aggregate views of health records shared with your organization.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Members', value: data?.stats.members },
          { label: 'Recorded assessments', value: data?.stats.assessments },
          { label: 'Pending assessments', value: data?.stats.pendingAssessments },
          { label: 'Data completeness', value: data ? `${data.stats.dataCompleteness}%` : undefined },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-primary">
                <Brain className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold">{stat.value ?? (loading ? '...' : '—')}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assessment records by month</CardTitle>
          <CardDescription>Counts from the latest six-month period returned by the API</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.assessmentTrends.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.assessmentTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip />
                <Bar dataKey="assessed" name="Recorded assessments" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {loading ? 'Loading assessment data...' : 'No assessment data is available.'}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <p className="text-sm font-medium">Clinical insight generation is not enabled.</p>
        <p className="mt-1 text-xs text-muted-foreground">
          This page reports database aggregates only. It does not calculate health improvements,
          correlations, predictions, or recommended interventions.
        </p>
      </div>
    </div>
  );
}
