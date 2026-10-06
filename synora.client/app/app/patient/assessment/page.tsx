'use client';

import Link from 'next/link';
import { Brain, CalendarClock, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MedicalDisclaimer } from '@/components/shared/medical-disclaimer';
import { useApiData } from '@/hooks/use-api-data';
import type { RiskLevel } from '@/lib/types';

interface StoredAssessment {
  id: string;
  assessedAt: string;
  riskLevel: RiskLevel;
  score: number | null;
  modelVersion: string;
  summary: string;
}

const riskStyles: Record<RiskLevel, string> = {
  lower: 'bg-success/10 text-success',
  moderate: 'bg-warning/10 text-warning',
  elevated: 'bg-destructive/10 text-destructive',
};

export default function AssessmentPage() {
  const { data: assessments, error, loading } = useApiData<StoredAssessment[]>('/assessments');
  const latestAssessment = assessments?.[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Health Assessments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review assessments recorded in your health record.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Assessment status</CardTitle>
          </div>
          <CardDescription>
            Assessment generation is not available until a validated clinical assessment service is connected.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading assessments...</p>
          ) : latestAssessment ? (
            <div className="space-y-4 rounded-lg border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarClock className="h-4 w-4" />
                  {new Date(latestAssessment.assessedAt).toLocaleString()}
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${riskStyles[latestAssessment.riskLevel]}`}>
                  {latestAssessment.riskLevel} risk
                </span>
              </div>
              <p className="text-sm leading-relaxed">{latestAssessment.summary}</p>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Recorded model version</dt>
                  <dd className="font-medium">{latestAssessment.modelVersion}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Score</dt>
                  <dd className="font-medium">{latestAssessment.score ?? 'Not provided'}</dd>
                </div>
              </dl>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              {loading ? 'Loading assessments...' : 'No completed assessment is recorded for your account.'}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href="/app/patient/reports"><FileText className="mr-2 h-4 w-4" />View health record</Link>
        </Button>
      </div>

      <MedicalDisclaimer />
    </div>
  );
}
