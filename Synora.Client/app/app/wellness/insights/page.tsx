'use client';

import { Brain, TrendingUp, Activity, Users, Target, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { mockWellnessStats } from '@/lib/mock-data';

const trendData = Array.from({ length: 6 }, (_, i) => ({
  month: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'][i],
  avgRisk: Math.round(60 - i * 4 + Math.random() * 5),
  participation: Math.round(35 + i * 3 + Math.random() * 3),
}));

const categoryImprovements = [
  { category: 'Glucose Awareness', improvement: 30, members: 245 },
  { category: 'Physical Activity', improvement: 22, members: 312 },
  { category: 'Diet Quality', improvement: 18, members: 289 },
  { category: 'Sleep Consistency', improvement: 15, members: 198 },
  { category: 'Medication Adherence', improvement: 12, members: 156 },
];

const insights = [
  {
    title: 'Average member risk score decreased by 12% over 6 months',
    description: 'Members who completed at least 3 assessments showed the most significant improvement, suggesting that repeated engagement with Synora Intelligence insights drives healthier behaviors.',
    severity: 'positive',
  },
  {
    title: 'Glucose awareness category showed highest improvement (30%)',
    description: 'CGM-connected members demonstrated 18% better risk score improvement than non-CGM members. Consider expanding the CGM subsidy program.',
    severity: 'positive',
  },
  {
    title: 'Members with CGM data showed 18% better risk score improvement',
    description: 'The correlation between CGM adoption and risk improvement is strong. Targeted outreach to non-CGM members in the elevated-risk band could yield significant population health gains.',
    severity: 'info',
  },
  {
    title: 'Participation in risk screening increased from 35% to 49%',
    description: 'The automated reminder system has improved screening uptake. The remaining 51% represent an opportunity for further engagement campaigns.',
    severity: 'info',
  },
  {
    title: 'Sleep consistency is the weakest improvement area',
    description: 'Only 15% improvement suggests members struggle with sleep hygiene. A targeted sleep wellness program could address this gap.',
    severity: 'warning',
  },
];

const severityConfig = {
  positive: { label: 'Positive Trend', variant: 'default' as const, color: 'text-success', bg: 'bg-success/10' },
  info: { label: 'Observation', variant: 'secondary' as const, color: 'text-primary', bg: 'bg-primary/10' },
  warning: { label: 'Action Recommended', variant: 'destructive' as const, color: 'text-warning', bg: 'bg-warning/10' },
};

export default function WellnessInsightsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Insights</h1>
        <p className="text-sm text-muted-foreground mt-1">Aggregated population health intelligence from Synora Intelligence</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Members', value: mockWellnessStats.members.toString(), icon: Users, color: 'text-primary' },
          { label: 'Assessments Run', value: mockWellnessStats.assessments.toString(), icon: Brain, color: 'text-accent' },
          { label: 'Health Trend', value: `+${mockWellnessStats.healthTrend}%`, icon: TrendingUp, color: 'text-success' },
          { label: 'Avg Participation', value: '49%', icon: Target, color: 'text-chart-3' },
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

      {/* Risk score trend chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Population Risk Score Trend</CardTitle>
          <CardDescription>Average risk score and screening participation over 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="partGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                }}
              />
              <Area type="monotone" dataKey="avgRisk" name="Avg Risk Score" stroke="hsl(var(--chart-3))" fill="url(#riskGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="participation" name="Participation %" stroke="hsl(var(--chart-1))" fill="url(#partGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category improvements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Improvement by Category</CardTitle>
          <CardDescription>Health category improvements across your member population</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {categoryImprovements.map((cat) => (
            <div key={cat.category}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{cat.category}</span>
                  <span className="text-xs text-muted-foreground">({cat.members} members)</span>
                </div>
                <span className="text-sm font-semibold text-success">+{cat.improvement}%</span>
              </div>
              <Progress value={cat.improvement * 3} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* AI insights */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">AI-Generated Insights</h2>
        {insights.map((insight, i) => {
          const config = severityConfig[insight.severity as keyof typeof severityConfig];
          return (
            <Card key={i} className="transition-all hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.bg} ${config.color} flex-shrink-0`}>
                      <Brain className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">{insight.title}</CardTitle>
                      <CardDescription className="text-xs mt-1">{insight.description}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={config.variant}>{config.label}</Badge>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
