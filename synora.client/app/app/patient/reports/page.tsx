'use client';

import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MedicalDisclaimer } from '@/components/shared/medical-disclaimer';
import { useApiData } from '@/hooks/use-api-data';
import type { LabResult, RiskLevel } from '@/lib/types';

interface Profile {
  fullName: string;
  email: string;
}

interface StoredAssessment {
  id: string;
  assessedAt: string;
  riskLevel: RiskLevel;
  score: number | null;
  modelVersion: string;
  summary: string;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

export default function ReportsPage() {
  const { data: profile, error: profileError, loading: profileLoading } = useApiData<Profile>('/me');
  const { data: labs, error: labsError, loading: labsLoading } = useApiData<LabResult[]>('/labs');
  const { data: assessments, error: assessmentsError, loading: assessmentsLoading } =
    useApiData<StoredAssessment[]>('/assessments');
  const errors = [profileError, labsError, assessmentsError].filter(Boolean);
  const loading = profileLoading || labsLoading || assessmentsLoading;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Health Record Summary</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A summary of information currently saved to your Synora health record.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="mr-2 h-3.5 w-3.5" />Print
        </Button>
      </div>

      {errors.map((error) => (
        <div key={error} role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Patient information</CardTitle>
          <CardDescription>Profile information associated with this account</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Name</p>
            <p className="text-sm font-medium">{profile?.fullName ?? (loading ? 'Loading...' : 'Not available')}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="text-sm font-medium">{profile?.email ?? (loading ? 'Loading...' : 'Not available')}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recorded assessments</CardTitle>
          <CardDescription>Assessment data returned by the health record API</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {assessments?.length ? assessments.map((assessment) => (
            <div key={assessment.id} className="rounded-lg border border-border p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold capitalize">{assessment.riskLevel} risk</p>
                <p className="text-xs text-muted-foreground">{formatDate(assessment.assessedAt)}</p>
              </div>
              <p className="text-sm leading-relaxed">{assessment.summary}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Model: {assessment.modelVersion} · Score: {assessment.score ?? 'Not provided'}
              </p>
            </div>
          )) : (
            <p className="text-sm text-muted-foreground">
              {loading ? 'Loading assessments...' : 'No assessment records are available.'}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Laboratory results</CardTitle>
          <CardDescription>Manually recorded results; confirm values against the original laboratory report.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3">Parameter</th>
                  <th className="py-2 pr-3 text-right">Result</th>
                  <th className="py-2 pr-3">Unit</th>
                  <th className="py-2 pr-3">Reference</th>
                  <th className="py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {labs?.map((lab) => (
                  <tr key={lab.id ?? `${lab.parameter}-${lab.date}`} className="border-b border-border/40">
                    <td className="py-2 pr-3 font-medium">{lab.parameter}</td>
                    <td className="py-2 pr-3 text-right font-semibold">{lab.result}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{lab.unit}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{lab.reference}</td>
                    <td className="py-2 text-muted-foreground">{formatDate(lab.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!labs?.length && (
            <p className="mt-3 text-sm text-muted-foreground">
              {loading ? 'Loading lab results...' : 'No lab results are available.'}
            </p>
          )}
        </CardContent>
      </Card>

      <MedicalDisclaimer />
    </div>
  );
}
