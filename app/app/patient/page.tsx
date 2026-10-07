'use client';

import Link from 'next/link';
import {
  Brain,
  FlaskConical,
  Activity,
  Dna,
  FileText,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MedicalDisclaimer } from '@/components/shared/medical-disclaimer';
import { useAuth } from '@/lib/auth-context';

const quickActions = [
  { label: 'Upload Lab Report', desc: 'Add new lab results', icon: FlaskConical, href: '/app/patient/lab-upload', color: 'text-chart-1' },
  { label: 'View CGM Data', desc: 'Glucose intelligence', icon: Activity, href: '/app/patient/cgm', color: 'text-chart-2' },
  { label: 'Run AI Assessment', desc: 'Synora Intelligence analysis', icon: Brain, href: '/app/patient/assessment', color: 'text-chart-3' },
  { label: 'View Reports', desc: 'Health intelligence report', icon: FileText, href: '/app/patient/reports', color: 'text-chart-4' },
];

const dataSources = [
  { name: 'Lab Reports', status: 'connected', completeness: 100 },
  { name: 'CGM', status: 'connected', completeness: 85 },
  { name: 'Genomics', status: 'partial', completeness: 40 },
  { name: 'Insulin / Devices', status: 'not_connected', completeness: 0 },
  { name: 'Lifestyle', status: 'connected', completeness: 70 },
  { name: 'Clinical (EHR)', status: 'partial', completeness: 55 },
];

const statusConfig = {
  connected: { label: 'Connected', color: 'text-success', icon: CheckCircle2 },
  partial: { label: 'Partial', color: 'text-warning', icon: AlertCircle },
  not_connected: { label: 'Not Connected', color: 'text-muted-foreground', icon: Clock },
};

export default function PatientDashboard() {
  const { profile } = useAuth();
  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Welcome back, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your GenoGluco health intelligence overview
        </p>
      </div>

      {/* Profile completeness */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Profile Completeness</CardTitle>
              <CardDescription className="text-sm">Complete your profile for better AI insights</CardDescription>
            </div>
            <span className="text-2xl font-bold text-primary">82%</span>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={82} className="h-2" />
          <p className="mt-2 text-xs text-muted-foreground">
            Add genomic data and connect insulin devices to reach 100%
          </p>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href}>
              <Card className="group h-full transition-all hover:shadow-lg hover:border-primary/30 cursor-pointer">
                <CardContent className="pt-6">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted ${action.color} mb-3 transition-transform group-hover:scale-110`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold">{action.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Data sources & latest assessment */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Connected Data Sources</CardTitle>
            <CardDescription>Status of your health data integration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dataSources.map((source) => {
              const status = statusConfig[source.status as keyof typeof statusConfig];
              const StatusIcon = status.icon;
              return (
                <div key={source.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{source.name}</span>
                      <span className={`flex items-center gap-1 text-xs ${status.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20">
                      <Progress value={source.completeness} className="h-1.5" />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{source.completeness}%</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Latest Assessment</CardTitle>
            <CardDescription>Synora Intelligence health intelligence</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Risk Assessment</p>
                  <p className="text-xl font-bold text-warning mt-1">Moderate</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
                  <TrendingUp className="h-6 w-6 text-warning" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Assessment based on available data as of Sep 20, 2026
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Key contributing factors</span>
                <span className="font-medium">5 identified</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Data sources used</span>
                <span className="font-medium">4 of 6</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Last updated</span>
                <span className="font-medium">2 days ago</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/app/patient/assessment">
                View Full Assessment
                <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <MedicalDisclaimer variant="compact" />
    </div>
  );
}
