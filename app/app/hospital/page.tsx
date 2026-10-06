'use client';

import {
  Users,
  Brain,
  Activity,
  Database,
  TrendingUp,
  Building2,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { mockHospitalStats, mockRiskDistribution, mockHbA1cDistribution, mockAssessmentTrends, mockPatients } from '@/lib/mock-data';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const stats = [
  { label: 'Total Patients', value: mockHospitalStats.totalPatients.toLocaleString(), icon: Users, color: 'text-chart-1' },
  { label: 'Assessed', value: mockHospitalStats.assessedPatients.toLocaleString(), icon: Brain, color: 'text-chart-4' },
  { label: 'Pending', value: mockHospitalStats.pendingAssessments.toLocaleString(), icon: TrendingUp, color: 'text-chart-3' },
  { label: 'CGM Adoption', value: `${mockHospitalStats.cgmAdoption}%`, icon: Activity, color: 'text-chart-2' },
];

export default function HospitalDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          GenoGluco Enterprise
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Population-level metabolic intelligence</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="pt-5">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-muted ${stat.color} mb-2`}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Data completeness */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Data Completeness</CardTitle>
              <CardDescription>Overall data completeness across all patients</CardDescription>
            </div>
            <span className="text-2xl font-bold text-primary">{mockHospitalStats.dataCompleteness}%</span>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={mockHospitalStats.dataCompleteness} className="h-3" />
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Assessment trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assessment Trends</CardTitle>
            <CardDescription>Assessed vs pending over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={mockAssessmentTrends}>
                <defs>
                  <linearGradient id="assessedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="pendingGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="assessed" stroke="hsl(var(--chart-1))" fill="url(#assessedGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="pending" stroke="hsl(var(--chart-3))" fill="url(#pendingGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Risk Distribution</CardTitle>
            <CardDescription>Patient population by risk category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={mockRiskDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2}>
                  {mockRiskDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1.5">
              {mockRiskDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* HbA1c distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">HbA1c Distribution</CardTitle>
          <CardDescription>Patient population by HbA1c range</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mockHbA1cDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="range" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="patients" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent patients */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Patient Activity</CardTitle>
          <CardDescription>Aggregated and anonymized data for population-level views</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient ID</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Last Assessment</TableHead>
                <TableHead>Risk Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPatients.slice(0, 5).map((p, i) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-sm">PT-{1000 + i}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{['Endocrinology', 'Internal Medicine', 'Cardiology'][i % 3]}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.lastAssessment}</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                      p.assessment === 'lower' ? 'text-success bg-success/10' :
                      p.assessment === 'moderate' ? 'text-warning bg-warning/10' :
                      'text-destructive bg-destructive/10'
                    }`}>
                      {p.assessment}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
