'use client';

import Link from 'next/link';
import {
  Users,
  Brain,
  FlaskConical,
  Activity,
  Dna,
  FileText,
  ArrowRight,
  TrendingUp,
  Eye,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useApiData } from '@/hooks/use-api-data';
import type { DashboardOverview, Patient } from '@/lib/types';

const riskConfig = {
  lower: { label: 'Lower', color: 'text-success bg-success/10' },
  moderate: { label: 'Moderate', color: 'text-warning bg-warning/10' },
  elevated: { label: 'Elevated', color: 'text-destructive bg-destructive/10' },
};

const navTabs = [
  { label: 'Patients', href: '/app/doctor' },
  { label: 'Assessments', href: '/app/doctor' },
  { label: 'Lab Data', href: '/app/doctor' },
  { label: 'CGM', href: '/app/doctor' },
  { label: 'Genomics', href: '/app/doctor' },
  { label: 'AI Insights', href: '/app/doctor' },
  { label: 'Reports', href: '/app/doctor' },
];

export default function DoctorDashboard() {
  const { data: overview, error, loading } = useApiData<DashboardOverview>('/dashboard/overview');
  const patients = overview?.patients ?? [];
  const riskCount = (name: string) =>
    overview?.riskDistribution.find((item) => item.name.toLowerCase() === name)?.value ?? 0;
  const quickStats = [
    { label: 'Total Patients', value: overview?.stats.totalPatients.toLocaleString() ?? '—', icon: Users },
    { label: 'Pending Assessments', value: overview?.stats.pendingAssessments.toLocaleString() ?? '—', icon: Brain },
    { label: 'CGM Adoption', value: `${overview?.stats.cgmAdoption ?? 0}%`, icon: Activity },
    { label: 'Assessed Patients', value: overview?.stats.assessedPatients.toLocaleString() ?? '—', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          GenoGluco Clinical
        </h1>
        <p className="text-sm text-muted-foreground mt-1">A more connected view of patient data</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {quickStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="pt-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Nav tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {navTabs.map((tab) => (
          <Link key={tab.label} href={tab.href} className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors">
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Patient table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Patient List</CardTitle>
          <CardDescription>All patients under your care</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Data Available</TableHead>
                <TableHead>Assessment</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((patient: Patient) => (
                <TableRow key={patient.id} className="cursor-pointer hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {patient.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-sm font-medium">{patient.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{patient.age ?? '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{patient.dataAvailable}</TableCell>
                  <TableCell>
                    {patient.assessment ? (
                      <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium capitalize', riskConfig[patient.assessment].color)}>
                        {riskConfig[patient.assessment].label}
                      </span>
                    ) : <span className="text-xs text-muted-foreground">Not assessed</span>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {patient.lastUpdated ? new Date(patient.lastUpdated).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && !error && patients.length === 0 && (
                <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  No patients are assigned to your care team.
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* AI insights summary */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">AI Insights Overview</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">High-risk patients</span>
              <span className="text-lg font-bold text-destructive">{riskCount('elevated')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Moderate-risk patients</span>
              <span className="text-lg font-bold text-warning">{riskCount('moderate')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Low-risk patients</span>
              <span className="text-lg font-bold text-success">{riskCount('lower')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Assessments this month</span>
              <span className="text-lg font-bold">{overview?.stats.assessedPatients ?? '—'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              <CardTitle className="text-base">Patient Detail Navigation</CardTitle>
              <CardDescription className="text-xs">Workflow per patient</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 text-xs">
              {['Overview', 'Clinical', 'Labs', 'CGM', 'Genomics', 'Insulin', 'Lifestyle', 'AI', 'Explainability', 'Report'].map((step, i, arr) => (
                <div key={step} className="flex items-center gap-1">
                  <span className="rounded-md border border-border bg-muted/40 px-2 py-1 font-medium">{step}</span>
                  {i < arr.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
