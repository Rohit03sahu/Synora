'use client';

import Link from 'next/link';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Users,
  ArrowRight,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockPatients, mockContributionFactors, mockCrossSignalInsights } from '@/lib/mock-data';

const patientRiskSummaries = mockPatients.slice(0, 4).map((p) => ({
  ...p,
  topFactor: mockContributionFactors[0],
}));

const populationInsights = [
  {
    title: 'Rising HbA1c Trend',
    description: '32% of assessed patients show an upward HbA1c trend over the last 3 months. Consider intensified monitoring for the elevated-risk group.',
    severity: 'warning',
    affectedCount: 286,
    icon: TrendingUp,
  },
  {
    title: 'CGM Adoption Gap',
    description: 'Patients with CGM data show 18% better risk score improvement compared to those without. 57% of elevated-risk patients do not have CGM connected.',
    severity: 'info',
    affectedCount: 104,
    icon: Activity,
  },
  {
    title: 'Genomic-Clinical Correlation',
    description: 'Patients with both genomic and clinical data show stronger assessment confidence. Recommend genomics upload for patients with borderline risk.',
    severity: 'info',
    affectedCount: 198,
    icon: Brain,
  },
  {
    title: 'Cross-Signal: Sleep & Glucose',
    description: 'Across your patient panel, poor sleep nights correlate with 12-18 mg/dL higher fasting glucose the following morning. Lifestyle intervention recommended.',
    severity: 'warning',
    affectedCount: 152,
    icon: Lightbulb,
  },
];

const severityConfig = {
  warning: { label: 'Action Recommended', variant: 'destructive' as const },
  info: { label: 'Observation', variant: 'secondary' as const },
};

export default function DoctorInsightsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">AI Insights</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Synora Intelligence population insights and patient-level intelligence
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Insights', value: '4', icon: Brain, color: 'text-primary' },
          { label: 'Action Required', value: '2', icon: AlertTriangle, color: 'text-warning' },
          { label: 'Patients Monitored', value: '892', icon: Users, color: 'text-accent' },
          { label: 'Avg Confidence', value: '87%', icon: TrendingUp, color: 'text-success' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted ${stat.color} mb-3`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Population insights */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Population Insights</h2>
        {populationInsights.map((insight, i) => {
          const Icon = insight.icon;
          const config = severityConfig[insight.severity as keyof typeof severityConfig];
          return (
            <Card key={i} className="transition-all hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{insight.title}</CardTitle>
                      <CardDescription className="text-sm mt-1">{insight.description}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={config.variant}>{config.label}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Affects approximately <span className="font-semibold text-foreground">{insight.affectedCount}</span> patients
                  </p>
                  <Link href="/app/doctor/patients" className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
                    View affected patients <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Patient risk highlights */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Patient Risk Highlights</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {patientRiskSummaries.map((patient) => {
            const riskColor =
              patient.assessment === 'elevated' ? 'text-destructive bg-destructive/10' :
              patient.assessment === 'moderate' ? 'text-warning bg-warning/10' :
              'text-success bg-success/10';
            return (
              <Card key={patient.id} className="transition-all hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{patient.name}</CardTitle>
                      <CardDescription className="text-sm">
                        Age {patient.age} · {patient.dataAvailable}
                      </CardDescription>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${riskColor}`}>
                      {patient.assessment}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Top contributing factor</span>
                      <span className="font-medium">{patient.topFactor.name} ({patient.topFactor.contribution}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${patient.topFactor.contribution}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{patient.topFactor.explanation}</p>
                  <Link href="/app/doctor/patients" className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
                    View full assessment <ArrowRight className="h-3 w-3" />
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Cross-signal insights */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Cross-Signal Patterns</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {mockCrossSignalInsights.map((insight, i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle className="text-sm">{insight.title}</CardTitle>
                <CardDescription className="text-xs">{insight.result}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{insight.description}</p>
                <div className="flex flex-wrap gap-1 mt-3">
                  {insight.signals.map((signal) => (
                    <Badge key={signal} variant="secondary" className="text-[10px]">{signal}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
