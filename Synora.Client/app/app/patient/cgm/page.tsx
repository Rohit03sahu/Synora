'use client';

import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  LineChart,
  Line,
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
  ReferenceLine,
} from 'recharts';
import { cn } from '@/lib/utils';
import { useApiData } from '@/hooks/use-api-data';
import type { CGMMetric } from '@/lib/types';

const timeFilters = ['7 Days', '14 Days', '30 Days', '90 Days'];

const trendIcons = { up: TrendingUp, down: TrendingDown, stable: Minus };
const statusColors = { good: 'text-success', warning: 'text-warning', critical: 'text-destructive' };

export default function CGMDashboard() {
  const [timeFilter, setTimeFilter] = useState('14 Days');
  const days = Number.parseInt(timeFilter, 10);
  const { data, error, loading } = useApiData<CgmResponse>(`/cgm?days=${days}`);
  const readings = data?.readings ?? [];
  const groupedByDay = new Map<string, number[]>();
  const groupedByHour = new Map<number, number[]>();
  readings.forEach((reading) => {
    const timestamp = new Date(reading.recordedAt);
    const day = timestamp.toISOString().slice(0, 10);
    const dayValues = groupedByDay.get(day) ?? [];
    dayValues.push(reading.glucoseMgDl);
    groupedByDay.set(day, dayValues);
    const hour = timestamp.getUTCHours();
    const hourValues = groupedByHour.get(hour) ?? [];
    hourValues.push(reading.glucoseMgDl);
    groupedByHour.set(hour, hourValues);
  });
  const dailyReadings = Array.from(groupedByDay.entries()).sort(([left], [right]) => left.localeCompare(right));
  const glucoseTrendData = dailyReadings.map(([day, values]) => ({
    day: new Date(`${day}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
    average: Math.round(average(values)),
    low: Math.round(Math.min(...values)),
    high: Math.round(Math.max(...values)),
  }));
  const glucoseValues = readings.map((reading) => reading.glucoseMgDl);
  const averageGlucose = average(glucoseValues);
  const timeInRange = glucoseValues.length
    ? [
        { name: 'In Range (70-180)', value: percentage(glucoseValues.filter((value) => value >= 70 && value <= 180).length, glucoseValues.length), color: 'hsl(var(--chart-4))' },
        { name: 'Above Range (>180)', value: percentage(glucoseValues.filter((value) => value > 180).length, glucoseValues.length), color: 'hsl(var(--chart-3))' },
        { name: 'Below Range (<70)', value: percentage(glucoseValues.filter((value) => value < 70).length, glucoseValues.length), color: 'hsl(var(--chart-5))' },
      ]
    : [];
  const cgmMetrics: CGMMetric[] = glucoseValues.length
    ? [
        { label: 'Average Glucose', value: averageGlucose.toFixed(0), unit: 'mg/dL', trend: 'stable', status: averageGlucose <= 140 ? 'good' : averageGlucose <= 180 ? 'warning' : 'critical' },
        { label: 'Time in Range', value: String(timeInRange[0].value), unit: '%', trend: 'stable', status: timeInRange[0].value >= 70 ? 'good' : timeInRange[0].value >= 50 ? 'warning' : 'critical' },
        { label: 'Time Above Range', value: String(timeInRange[1].value), unit: '%', trend: 'stable', status: timeInRange[1].value <= 25 ? 'good' : 'warning' },
        { label: 'Time Below Range', value: String(timeInRange[2].value), unit: '%', trend: 'stable', status: timeInRange[2].value <= 4 ? 'good' : 'warning' },
        { label: 'Glucose Variability', value: glucoseValues.length > 1 ? coefficientOfVariation(glucoseValues).toFixed(0) : '0', unit: '%', trend: 'stable', status: glucoseValues.length > 1 && coefficientOfVariation(glucoseValues) <= 36 ? 'good' : 'warning' },
        { label: 'GMI', value: (3.31 + 0.02392 * averageGlucose).toFixed(1), unit: '%', trend: 'stable', status: 'warning' },
      ]
    : [];
  const glucoseVariability = dailyReadings.map(([day, values]) => ({
    day: new Date(`${day}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
    cv: coefficientOfVariation(values),
  }));
  const dailyPattern = Array.from(groupedByHour.entries())
    .sort(([left], [right]) => left - right)
    .map(([hour, values]) => ({ hour: `${hour}:00`, glucose: Math.round(average(values)) }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Your Glucose Intelligence</h1>
          <p className="text-sm text-muted-foreground mt-1">Continuous glucose monitoring insights</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
          {timeFilters.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeFilter(tf)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                timeFilter === tf ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {cgmMetrics.map((metric) => {
          const TrendIcon = trendIcons[metric.trend];
          return (
            <Card key={metric.label}>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                  <div className={cn('flex items-center gap-0.5 text-xs', statusColors[metric.status])}>
                    <TrendIcon className="h-3 w-3" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{metric.value}</span>
                  <span className="text-sm text-muted-foreground">{metric.unit}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}
      {!loading && !error && readings.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          No CGM readings are available for this period. Connect a CGM or import readings to view glucose trends.
        </div>
      )}

      {/* Glucose trend chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Glucose Trend</CardTitle>
          <CardDescription>Average, high, and low glucose over {timeFilter.toLowerCase()}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={glucoseTrendData}>
              <defs>
                <linearGradient id="avgGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
              <ReferenceLine y={70} stroke="hsl(var(--chart-5))" strokeDasharray="5 5" label={{ value: 'Low', fontSize: 10, fill: 'hsl(var(--chart-5))' }} />
              <ReferenceLine y={180} stroke="hsl(var(--chart-3))" strokeDasharray="5 5" label={{ value: 'High', fontSize: 10, fill: 'hsl(var(--chart-3))' }} />
              <Area type="monotone" dataKey="high" stroke="hsl(var(--chart-3))" fill="none" strokeWidth={1} strokeDasharray="4 4" />
              <Area type="monotone" dataKey="low" stroke="hsl(var(--chart-5))" fill="none" strokeWidth={1} strokeDasharray="4 4" />
              <Area type="monotone" dataKey="average" stroke="hsl(var(--chart-1))" fill="url(#avgGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Time in range */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Time in Range</CardTitle>
            <CardDescription>Glucose distribution over selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={timeInRange} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2}>
                  {timeInRange.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1.5">
              {timeInRange.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-semibold">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Glucose variability */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Glucose Variability</CardTitle>
            <CardDescription>Coefficient of variation over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={glucoseVariability}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <ReferenceLine y={36} stroke="hsl(var(--warning))" strokeDasharray="5 5" label={{ value: 'Target 36%', fontSize: 10, fill: 'hsl(var(--warning))' }} />
                <Bar dataKey="cv" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Daily pattern */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily Glucose Pattern</CardTitle>
          <CardDescription>Average glucose by hour of day</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={dailyPattern}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hour" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" interval={2} />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
              <ReferenceLine y={70} stroke="hsl(var(--chart-5))" strokeDasharray="5 5" />
              <ReferenceLine y={180} stroke="hsl(var(--chart-3))" strokeDasharray="5 5" />
              <Line type="monotone" dataKey="glucose" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

interface CgmResponse {
  days: number;
  readings: { id: string; recordedAt: string; glucoseMgDl: number; source: string }[];
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function percentage(part: number, whole: number) {
  return Math.round((part / whole) * 100);
}

function coefficientOfVariation(values: number[]) {
  const mean = average(values);
  if (mean === 0 || values.length < 2) return 0;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return (Math.sqrt(variance) / mean) * 100;
}
