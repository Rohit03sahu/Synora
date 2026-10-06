'use client';

import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Dna,
  FileText,
  FlaskConical,
  Syringe,
  Watch,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MedicalDisclaimer } from '@/components/shared/medical-disclaimer';
import { useApiData } from '@/hooks/use-api-data';
import { useAuth } from '@/lib/auth-context';
import type { LabResult, RiskLevel } from '@/lib/types';

interface StoredAssessment {
  id: string;
  assessedAt: string;
  riskLevel: RiskLevel;
  score: number | null;
  modelVersion: string;
  summary: string;
}

interface InsulinData {
  events: unknown[];
  basalRates: unknown[];
}

interface CgmReading {
  id: string;
}

interface CgmData {
  readings: CgmReading[];
}

const actions = [
  { label: 'Add Lab Result', desc: 'Record a verified result', icon: FlaskConical, href: '/app/patient/lab-upload' },
  { label: 'View CGM Data', desc: 'Review stored glucose readings', icon: Activity, href: '/app/patient/cgm' },
  { label: 'Genomics', desc: 'Review stored variants', icon: Dna, href: '/app/patient/genomics' },
  { label: 'Health Record', desc: 'Review saved health information', icon: FileText, href: '/app/patient/reports' },
];

const sourceLinks = [
  { label: 'Laboratory results', href: '/app/patient/lab-upload', icon: FlaskConical },
  { label: 'CGM readings', href: '/app/patient/cgm', icon: Activity },
  { label: 'Genomic variants', href: '/app/patient/genomics', icon: Dna },
  { label: 'Insulin events', href: '/app/patient/insulin', icon: Syringe },
  { label: 'Device records', href: '/app/patient/insulin', icon: Watch },
];

const riskStyles: Record<RiskLevel, string> = {
  lower: 'bg-success/10 text-success',
  moderate: 'bg-warning/10 text-warning',
  elevated: 'bg-destructive/10 text-destructive',
};

export default function PatientDashboard() {
  const { profile } = useAuth();
  const { data: labs, error: labsError, loading: labsLoading } = useApiData<LabResult[]>('/labs');
  const { data: cgm, error: cgmError, loading: cgmLoading } = useApiData<CgmData>('/cgm');
  const { data: variants, error: genomicsError, loading: genomicsLoading } =
    useApiData<unknown[]>('/genomics');
  const { data: insulin, error: insulinError, loading: insulinLoading } =
    useApiData<InsulinData>('/insulin');
  const { data: devices, error: devicesError, loading: devicesLoading } =
    useApiData<unknown[]>('/devices');
  const { data: assessments, error: assessmentsError, loading: assessmentsLoading } =
    useApiData<StoredAssessment[]>('/assessments');

  const firstName = profile?.full_name?.split(' ')[0] || 'there';
  const latestAssessment = assessments?.[0];
  const errors = [labsError, cgmError, genomicsError, insulinError, devicesError, assessmentsError].filter(Boolean);
  const loading = labsLoading || cgmLoading || genomicsLoading || insulinLoading || devicesLoading || assessmentsLoading;
  const sourceCounts = [
    labs?.length,
    cgm?.readings.length,
    variants?.length,
    insulin?.events?.length,
    devices?.length,
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Welcome back, {firstName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">A summary of information currently saved in your health record.</p>
      </div>

      {errors.map((error) => (
        <div key={error} role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ))}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href}>
              <Card className="group h-full transition-all hover:border-primary/30 hover:shadow-lg">
                <CardContent className="pt-6">
                  <Icon className="mb-3 h-5 w-5 text-primary transition-transform group-hover:scale-110" />
                  <p className="text-sm font-semibold">{action.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{action.desc}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Saved health data</CardTitle>
            <CardDescription>Counts are based on records returned by your health record API.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sourceLinks.map((source, index) => {
              const Icon = source.icon;
              const count = sourceCounts[index];
              return (
                <Link key={source.label} href={source.href} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Icon className="h-4 w-4 text-muted-foreground" />{source.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {count === undefined ? (loading ? 'Loading...' : 'Unavailable') : `${count} ${count === 1 ? 'record' : 'records'}`}
                  </span>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Latest recorded assessment</CardTitle>
            <CardDescription>Assessments are displayed as recorded; no new assessment is generated here.</CardDescription>
          </CardHeader>
          <CardContent>
            {latestAssessment ? (
              <div className="space-y-4 rounded-lg border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${riskStyles[latestAssessment.riskLevel]}`}>
                    {latestAssessment.riskLevel} risk
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(latestAssessment.assessedAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm">{latestAssessment.summary}</p>
                <p className="text-xs text-muted-foreground">
                  Model {latestAssessment.modelVersion} · Score {latestAssessment.score ?? 'not provided'}
                </p>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/app/patient/assessment">View assessment details <ArrowRight className="ml-2 h-3.5 w-3.5" /></Link>
                </Button>
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                {assessmentsLoading ? 'Loading assessment records...' : 'No completed assessment is recorded.'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <MedicalDisclaimer variant="compact" />
    </div>
  );
}
