'use client';

import { Activity, Brain, TrendingUp, Users } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApiData } from '@/hooks/use-api-data';
import type { DashboardOverview } from '@/lib/types';

const riskColors: Record<string, string> = {
  Lower: 'hsl(var(--chart-4))',
  Moderate: 'hsl(var(--chart-3))',
  Elevated: 'hsl(var(--chart-5))',
};

export default function HospitalDashboard() {
  const { data: overview, error, loading } = useApiData<DashboardOverview>('/dashboard/overview');
  const stats = overview?.stats;
  const summaryCards = [
    { label: 'Total Patients', value: stats?.totalPatients.toLocaleString() ?? '—', icon: Users, color: 'text-chart-1' },
    { label: 'Assessed', value: stats?.assessedPatients.toLocaleString() ?? '—', icon: Brain, color: 'text-chart-4' },
    { label: 'Pending', value: stats?.pendingAssessments.toLocaleString() ?? '—', icon: TrendingUp, color: 'text-chart-3' },
    { label: 'CGM Adoption', value: stats ? `${stats.cgmAdoption}%` : '—', icon: Activity, color: 'text-chart-2' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">GenoGluco Enterprise</h1>
        <p className="mt-1 text-sm text-muted-foreground">Population-level metabolic intelligence</p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="pt-5">
                <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-muted ${stat.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Data Completeness</CardTitle>
              <CardDescription>Available source categories across authorized patients</CardDescription>
            </div>
            <span className="text-2xl font-bold text-primary">{stats ? `${stats.dataCompleteness}%` : '—'}</span>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={stats?.dataCompleteness ?? 0} className="h-3" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assessments by Month</CardTitle>
            <CardDescription>Recorded assessments for patients visible to your organization</CardDescription>
          </CardHeader>
          <CardContent>
            {(overview?.assessmentTrends.length ?? 0) > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={overview?.assessmentTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="assessed" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1) / 0.15)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">No assessment history is available.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Risk Distribution</CardTitle>
            <CardDescription>Latest recorded assessment per authorized patient</CardDescription>
          </CardHeader>
          <CardContent>
            {(overview?.riskDistribution.length ?? 0) > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={overview?.riskDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2}>
                      {overview?.riskDistribution.map((entry) => (
                        <Cell key={entry.name} fill={riskColors[entry.name] ?? 'hsl(var(--muted-foreground))'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5">
                  {overview?.riskDistribution.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: riskColors[item.name] }} />
                        <span className="text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="font-semibold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">No assessments are available.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">HbA1c Distribution</CardTitle>
          <CardDescription>Recorded HbA1c values grouped by clinical range</CardDescription>
        </CardHeader>
        <CardContent>
          {(overview?.hba1cDistribution.length ?? 0) > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={overview?.hba1cDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="range" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="patients" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">No numeric HbA1c results are available.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Authorized Patient Activity</CardTitle>
          <CardDescription>Patient information is shown only where membership and sharing consent permit access.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Data Available</TableHead>
                <TableHead>Last Assessment</TableHead>
                <TableHead>Risk Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(overview?.patients ?? []).map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="text-sm font-medium">{patient.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{patient.dataAvailable}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {patient.lastAssessment ? new Date(`${patient.lastAssessment}T00:00:00`).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell className="text-sm capitalize">{patient.assessment ?? 'Not assessed'}</TableCell>
                </TableRow>
              ))}
              {!loading && !error && !overview?.patients.length && (
                <TableRow><TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                  No patients are linked to this organization.
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
