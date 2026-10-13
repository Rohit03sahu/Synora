'use client';

import Link from 'next/link';
import { ArrowRight, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useApiData } from '@/hooks/use-api-data';
import type { DashboardOverview, RiskLevel } from '@/lib/types';

const riskStyles: Record<RiskLevel, string> = {
  lower: 'bg-success/10 text-success',
  moderate: 'bg-warning/10 text-warning',
  elevated: 'bg-destructive/10 text-destructive',
};

export default function DoctorInsightsPage() {
  const { data, error, loading } = useApiData<DashboardOverview>('/dashboard/overview');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Population Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Current records for patients shared with your care team.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: 'Visible patients', value: data?.stats.totalPatients },
          { label: 'With recorded assessment', value: data?.stats.assessedPatients },
          { label: 'Pending assessment', value: data?.stats.pendingAssessments },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold">{stat.value ?? (loading ? '...' : '—')}</p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recorded assessment distribution</CardTitle>
          <CardDescription>Most recent recorded assessment per visible patient</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.riskDistribution.length ? (
            <div className="flex flex-wrap gap-3">
              {data.riskDistribution.map((item) => (
                <div key={item.name} className="rounded-lg border border-border px-4 py-3">
                  <p className="text-2xl font-bold">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.name}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {loading ? 'Loading assessment data...' : 'No recorded assessments are available.'}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Patient records</CardTitle>
          <CardDescription>Only patients with valid sharing authorization are returned.</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.patients.length ? (
            <div className="divide-y divide-border">
              {data.patients.map((patient) => (
                <div key={patient.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium">{patient.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {patient.age === null ? 'Age not provided' : `Age ${patient.age}`}
                      {' · '}{patient.dataAvailable || 'No health data listed'}
                      {' · '}Updated {patient.lastUpdated ? new Date(patient.lastUpdated).toLocaleDateString() : '—'}
                    </p>
                  </div>
                  {patient.assessment ? (
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${riskStyles[patient.assessment]}`}>
                      {patient.assessment}
                    </span>
                  ) : <span className="text-xs text-muted-foreground">No assessment</span>}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center">
              <Users className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {loading ? 'Loading patient records...' : 'No shared patient records are available.'}
              </p>
            </div>
          )}
          <Link href="/app/doctor/patients" className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            Open patient list <ArrowRight className="h-3 w-3" />
          </Link>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Automated population insights and cross-signal clinical recommendations are not available.
        These figures describe stored records and are not clinical guidance.
      </p>
    </div>
  );
}
