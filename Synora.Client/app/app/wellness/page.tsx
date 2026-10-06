'use client';

import { Users, Brain, FileText, TrendingUp, Leaf } from 'lucide-react';
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { mockWellnessStats } from '@/lib/mock-data';
import { Progress } from '@/components/ui/progress';

const stats = [
  { label: 'Members', value: mockWellnessStats.members.toLocaleString(), icon: Users },
  { label: 'Assessments', value: mockWellnessStats.assessments.toLocaleString(), icon: Brain },
  { label: 'Completed Surveys', value: mockWellnessStats.completedSurveys.toLocaleString(), icon: FileText },
  { label: 'Health Trend', value: `+${mockWellnessStats.healthTrend}%`, icon: TrendingUp },
];

const healthTrends = Array.from({ length: 6 }, (_, i) => ({
  month: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'][i],
  avgRisk: Math.round(45 - i * 2 + Math.random() * 5),
  participation: Math.round(60 + i * 5 + Math.random() * 10),
}));

const categoryBreakdown = [
  { category: 'Diet', improvement: 15 },
  { category: 'Activity', improvement: 22 },
  { category: 'Sleep', improvement: 8 },
  { category: 'Stress', improvement: 12 },
  { category: 'Glucose Awareness', improvement: 30 },
];

export default function WellnessDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          GenoGluco Wellness
        </h1>
        <p className="text-sm text-muted-foreground mt-1">From wellness tracking to preventive intelligence</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="pt-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent mb-2">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <p className="text-xs text-muted-foreground">
          Individual health information is not exposed to organizations without appropriate
          authorization and consent. All population views use aggregated and anonymized data.
        </p>
      </div>

      {/* Health trends chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Population Health Trends</CardTitle>
          <CardDescription>Average risk score and participation over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={healthTrends}>
              <defs>
                <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="partGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
              <Area type="monotone" dataKey="avgRisk" stroke="hsl(var(--chart-1))" fill="url(#riskGrad)" strokeWidth={2} name="Avg Risk Score" />
              <Area type="monotone" dataKey="participation" stroke="hsl(var(--chart-4))" fill="url(#partGrad)" strokeWidth={2} name="Participation %" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category improvements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Wellness Category Improvements</CardTitle>
          <CardDescription>Average improvement across wellness categories (last 6 months)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryBreakdown} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={120} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="improvement" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Survey completion */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Survey Completion Rate</CardTitle>
          <CardDescription>Member engagement with health surveys</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Health Survey</span>
              <span className="font-semibold">79%</span>
            </div>
            <Progress value={79} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Lifestyle Questionnaire</span>
              <span className="font-semibold">85%</span>
            </div>
            <Progress value={85} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Risk Screening</span>
              <span className="font-semibold">49%</span>
            </div>
            <Progress value={49} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Follow-up Survey</span>
              <span className="font-semibold">62%</span>
            </div>
            <Progress value={62} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Population insights */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-accent" />
            <CardTitle className="text-base">Aggregated Population Insights</CardTitle>
          </div>
          <CardDescription>Anonymized trends across your wellness population</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            'Average member risk score decreased by 12% over 6 months',
            'Glucose awareness category showed highest improvement (30%)',
            'Members with CGM data showed 18% better risk score improvement',
            'Participation in risk screening increased from 35% to 49%',
          ].map((insight, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent text-xs font-bold mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm">{insight}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
