'use client';

import { useState } from 'react';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  GitMerge,
  Sparkles,
  FileText,
  Download,
  Share2,
  ChevronDown,
  ChevronUp,
  Database,
  Activity,
  Dna,
  Watch,
  FlaskConical,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MedicalDisclaimer } from '@/components/shared/medical-disclaimer';
import { mockContributionFactors, mockCrossSignalInsights } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const trendIcons = { up: TrendingUp, down: TrendingDown, stable: Minus };
const riskConfig = {
  lower: { label: 'Lower', color: 'text-success', bg: 'bg-success/10', border: 'border-success/30' },
  moderate: { label: 'Moderate', color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' },
  elevated: { label: 'Elevated', color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' },
};

const dataSourceIcons = {
  Laboratory: FlaskConical,
  CGM: Activity,
  Profile: Brain,
  Lifestyle: TrendingUp,
  Genomics: Dna,
  'Insulin/Devices': Watch,
};

export default function AssessmentPage() {
  const [explanationLevel, setExplanationLevel] = useState<'simple' | 'detailed' | 'clinical'>('detailed');
  const [expandedFactor, setExpandedFactor] = useState<string | null>('HbA1c');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Synora Intelligence Health Intelligence</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connecting multiple health signals to generate explainable insights
        </p>
      </div>

      {/* Fusion diagram */}
      <Card className="overflow-hidden">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4">
            {/* Data sources row */}
            <div className="flex flex-wrap justify-center gap-3">
              {['EHR', 'CGM', 'Genomics', 'Insulin', 'Labs', 'Lifestyle'].map((src) => {
                const Icon = dataSourceIcons[src as keyof typeof dataSourceIcons] || Database;
                return (
                  <div key={src} className="flex flex-col items-center gap-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{src}</span>
                  </div>
                );
              })}
            </div>

            <div className="h-6 w-px bg-primary/30" />

            {/* Fusion center */}
            <div className="flex items-center gap-3 rounded-xl border-2 border-primary bg-primary/5 px-6 py-3">
              <GitMerge className="h-5 w-5 text-primary" />
              <span className="text-sm font-bold text-primary">MULTIMODAL FUSION</span>
            </div>

            <div className="h-6 w-px bg-primary/30" />

            {/* Pipeline */}
            <div className="flex flex-wrap justify-center gap-2">
              {['Risk Assessment', 'Explainability', 'Personalized Insights'].map((step, i, arr) => (
                <div key={step} className="flex items-center gap-2">
                  <span className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium">{step}</span>
                  {i < arr.length - 1 && <span className="text-primary">→</span>}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assessment result */}
      <Card className={cn('border-2', riskConfig.moderate.border)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Your GenoGluco Assessment</CardTitle>
              <CardDescription>Assessment based on available data as of Sep 20, 2026</CardDescription>
            </div>
            <div className={cn('flex items-center gap-3 rounded-xl px-4 py-2', riskConfig.moderate.bg)}>
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-full', riskConfig.moderate.bg)}>
                <TrendingUp className={cn('h-5 w-5', riskConfig.moderate.color)} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Risk Level</p>
                <p className={cn('text-lg font-bold', riskConfig.moderate.color)}>Moderate</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This assessment combines clinical, laboratory, CGM, genomic, and lifestyle data. It is
            not a medical diagnosis. Please consult a healthcare professional for medical decisions.
          </p>
        </CardContent>
      </Card>

      {/* What We Found */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">What We Found</CardTitle>
          <CardDescription>Key observations from your health data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            'HbA1c is in the prediabetes range (5.8%)',
            'Fasting glucose slightly elevated at 102 mg/dL',
            'CGM shows 72% time in range (target: >80%)',
            'Post-meal spikes detected after high-carb meals',
            'Family history of Type 2 diabetes (father, grandparent)',
            'Physical activity below recommended levels (2x/week)',
          ].map((obs, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm">{obs}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* What Contributed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">What Contributed</CardTitle>
          <CardDescription>Factors influencing your assessment, ranked by contribution</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mockContributionFactors.map((factor) => {
            const TrendIcon = trendIcons[factor.trend];
            const isExpanded = expandedFactor === factor.name;
            const FactorIcon = dataSourceIcons[factor.dataSource as keyof typeof dataSourceIcons] || Database;
            return (
              <div key={factor.name} className="rounded-lg border border-border">
                <button
                  onClick={() => setExpandedFactor(isExpanded ? null : factor.name)}
                  className="flex w-full items-center gap-4 p-4"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{factor.name}</span>
                        <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                          <TrendIcon className="h-3 w-3" />
                          {factor.trend}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold">{factor.value}</span>
                        <span className="text-xs text-muted-foreground w-10 text-right">{factor.contribution}%</span>
                      </div>
                    </div>
                    <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          factor.contribution > 70 ? 'bg-destructive' : factor.contribution > 45 ? 'bg-warning' : 'bg-success'
                        )}
                        style={{ width: `${factor.contribution}%` }}
                      />
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
                {isExpanded && (
                  <div className="border-t border-border/60 p-4 space-y-3 animate-fade-in-up">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Current Value</p>
                        <p className="text-sm font-semibold mt-0.5">{factor.value}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Trend</p>
                        <p className="text-sm font-semibold mt-0.5 capitalize">{factor.trend}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Contribution</p>
                        <p className="text-sm font-semibold mt-0.5">{factor.contribution}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Data Source</p>
                        <p className="text-sm font-semibold mt-0.5 flex items-center gap-1">
                          <FactorIcon className="h-3 w-3" /> {factor.dataSource}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Explanation</p>
                      <p className="text-sm text-foreground leading-relaxed">{factor.explanation}</p>
                    </div>
                    {explanationLevel === 'clinical' && (
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                        <p className="text-xs font-semibold text-primary mb-1">Clinical Detail (SHAP)</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          SHAP value: {factor.contribution > 60 ? '+' : '-'}0.{factor.contribution}.
                          This feature contributes {factor.contribution > 50 ? 'positively' : 'negatively'} to the
                          risk prediction. The model weights this factor based on its relative importance
                          in the training distribution and its interaction with other features.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Cross-Signal Insights */}
      <Card className="border-accent/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <GitMerge className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Cross-Signal Insights</CardTitle>
              <CardDescription>Unique GenoGluco feature — relationships across data sources</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {mockCrossSignalInsights.map((insight) => (
            <div key={insight.title} className="rounded-lg border border-border bg-card p-4 space-y-3">
              <h4 className="text-sm font-semibold">{insight.title}</h4>
              <div className="flex flex-wrap items-center gap-2">
                {insight.signals.map((signal, i, arr) => (
                  <div key={signal} className="flex items-center gap-2">
                    <span className="rounded-md border border-accent/30 bg-accent/5 px-2.5 py-1 text-xs font-medium text-accent">
                      {signal}
                    </span>
                    {i < arr.length - 1 && <span className="text-accent font-bold">+</span>}
                  </div>
                ))}
                <span className="text-accent">→</span>
                <span className="rounded-md border border-foreground/20 bg-foreground/5 px-2.5 py-1 text-xs font-semibold">
                  {insight.result}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Explanation levels */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Eye className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">Why Did Synora Intelligence Generate This Assessment?</CardTitle>
              <CardDescription>Choose your preferred explanation level</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1 w-fit">
            {(['simple', 'detailed', 'clinical'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setExplanationLevel(level)}
                className={cn(
                  'rounded-md px-4 py-1.5 text-xs font-medium capitalize transition-colors',
                  explanationLevel === level ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {level}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {explanationLevel === 'simple' && (
              <div className="space-y-3 animate-fade-in-up">
                {mockContributionFactors.map((factor) => (
                  <div key={factor.name} className="flex items-center gap-4">
                    <span className="text-sm font-medium w-32 flex-shrink-0">{factor.name}</span>
                    <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                      <div className={cn('h-full rounded-full', factor.contribution > 60 ? 'bg-warning' : 'bg-success')} style={{ width: `${factor.contribution}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-16 text-right">{factor.value}</span>
                  </div>
                ))}
                <p className="text-sm text-muted-foreground pt-2">
                  These are the main things that influenced your assessment. The longer the bar, the
                  more it contributed.
                </p>
              </div>
            )}

            {explanationLevel === 'detailed' && (
              <div className="space-y-3 animate-fade-in-up">
                <p className="text-sm text-muted-foreground">
                  Synora Intelligence analyzed 6 data sources and identified 5 key contributing factors.
                  Each factor is weighted based on its clinical significance and interaction with
                  other signals.
                </p>
                {mockContributionFactors.map((factor) => (
                  <div key={factor.name} className="flex items-start gap-3 rounded-lg border border-border p-3">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold">
                      {factor.contribution}%
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">{factor.name}</p>
                        <span className="text-xs text-muted-foreground">{factor.value}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{factor.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {explanationLevel === 'clinical' && (
              <div className="space-y-3 animate-fade-in-up">
                <p className="text-sm text-muted-foreground">
                  Technical explanation for healthcare professionals. Includes SHAP values, model
                  confidence intervals, and feature interaction analysis.
                </p>
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
                  <p className="text-xs font-semibold text-primary">Model Details</p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div><span className="text-muted-foreground">Primary Model:</span> <span className="font-medium">XGBoost + LSTM Fusion</span></div>
                    <div><span className="text-muted-foreground">Confidence:</span> <span className="font-medium">87.3%</span></div>
                    <div><span className="text-muted-foreground">Data Modalities:</span> <span className="font-medium">4 of 6 connected</span></div>
                    <div><span className="text-muted-foreground">Features Used:</span> <span className="font-medium">23 of 47</span></div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Expand each factor above to view SHAP contribution values and clinical explanations.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Personalized Insights */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">What We Observed</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {['Borderline HbA1c trending upward', 'Post-meal glucose spikes after lunch', 'Sleep quality correlates with fasting glucose'].map((obs) => (
              <p key={obs} className="text-xs text-muted-foreground flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                {obs}
              </p>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-accent" />
              <CardTitle className="text-sm">Why It Matters</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {['Early intervention can prevent progression to Type 2', 'Lifestyle changes may reduce HbA1c significantly', 'Regular monitoring helps track improvements'].map((item) => (
              <p key={item} className="text-xs text-muted-foreground flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                {item}
              </p>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-warning" />
              <CardTitle className="text-sm">Discuss With Your Provider</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {['HbA1c trend and potential screening frequency', 'Whether CGM-guided lifestyle changes are appropriate', 'Family history implications for screening schedule'].map((item) => (
              <p key={item} className="text-xs text-muted-foreground flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-warning mt-1.5 flex-shrink-0" />
                {item}
              </p>
            ))}
          </CardContent>
        </Card>
      </div>

      <MedicalDisclaimer />

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline">
          <Share2 className="mr-2 h-4 w-4" />
          Share With Doctor
        </Button>
        <Button variant="outline" asChild>
          <a href="/app/patient/reports">
            <Download className="mr-2 h-4 w-4" />
            Download Report
          </a>
        </Button>
      </div>
    </div>
  );
}
