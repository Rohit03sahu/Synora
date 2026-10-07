'use client';

import {
  FileText,
  Download,
  Share2,
  Printer,
  Brain,
  CheckCircle2,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MedicalDisclaimer } from '@/components/shared/medical-disclaimer';
import { mockLabResults, mockContributionFactors, mockCrossSignalInsights } from '@/lib/mock-data';

const reportSections = [
  { num: 1, title: 'Patient Information', status: 'complete' },
  { num: 2, title: 'Assessment Date', status: 'complete' },
  { num: 3, title: 'Data Sources', status: 'complete' },
  { num: 4, title: 'Clinical Information', status: 'complete' },
  { num: 5, title: 'Laboratory Results', status: 'complete' },
  { num: 6, title: 'CGM Analysis', status: 'complete' },
  { num: 7, title: 'Insulin/Device Information', status: 'partial' },
  { num: 8, title: 'Genomic Context', status: 'partial' },
  { num: 9, title: 'Lifestyle Information', status: 'complete' },
  { num: 10, title: 'AI Assessment', status: 'complete' },
  { num: 11, title: 'Explainable AI', status: 'complete' },
  { num: 12, title: 'Cross-Signal Insights', status: 'complete' },
  { num: 13, title: 'Key Observations', status: 'complete' },
  { num: 14, title: 'Discussion Points', status: 'complete' },
  { num: 15, title: 'Data Quality', status: 'complete' },
  { num: 16, title: 'Disclaimer', status: 'complete' },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">GenoGluco Health Intelligence Report</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Powered by Synora Intelligence&trade; — Prepared by Synora Health
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-3.5 w-3.5" />
            Share With Doctor
          </Button>
          <Button size="sm">
            <Download className="mr-2 h-3.5 w-3.5" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Report preview */}
      <Card className="overflow-hidden">
        {/* Report header */}
        <div className="border-b border-border bg-gradient-to-r from-primary/5 to-accent/5 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-xl font-bold">GenoGluco Health Intelligence Report</h2>
              <p className="text-sm text-muted-foreground mt-1">Powered by Synora Intelligence&trade;</p>
              <p className="text-xs text-muted-foreground mt-0.5">Prepared by Synora Health</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Report Date</p>
              <p className="text-sm font-semibold">September 20, 2026</p>
              <p className="text-xs text-muted-foreground mt-2">Report ID</p>
              <p className="text-xs font-mono font-medium">GG-2026-0920-JD</p>
            </div>
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Patient info */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Patient Name</p>
              <p className="text-sm font-semibold">John Doe</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Age</p>
              <p className="text-sm font-semibold">42</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Assessment Date</p>
              <p className="text-sm font-semibold">Sep 20, 2026</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Risk Level</p>
              <p className="text-sm font-semibold text-warning">Moderate</p>
            </div>
          </div>

          {/* Data sources */}
          <div>
            <h3 className="text-sm font-bold mb-2">Data Sources Used</h3>
            <div className="flex flex-wrap gap-2">
              {['Laboratory', 'CGM', 'Genomics (Partial)', 'Lifestyle', 'Clinical Profile'].map((src) => (
                <span key={src} className="rounded-lg border border-border bg-muted/30 px-3 py-1 text-xs font-medium">
                  {src}
                </span>
              ))}
            </div>
          </div>

          {/* AI Assessment summary */}
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-warning" />
              <h3 className="text-sm font-bold">AI Assessment Summary</h3>
            </div>
            <p className="text-sm">
              Based on the combined analysis of 5 data sources, your assessment indicates a{' '}
              <span className="font-bold text-warning">Moderate</span> risk level. Key contributing
              factors include borderline HbA1c, elevated BMI, family history, glucose variability,
              and below-recommended physical activity.
            </p>
          </div>

          {/* Lab results table */}
          <div>
            <h3 className="text-sm font-bold mb-3">Laboratory Results</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-xs text-muted-foreground">Parameter</th>
                    <th className="text-right py-2 text-xs text-muted-foreground">Result</th>
                    <th className="text-left py-2 text-xs text-muted-foreground">Unit</th>
                    <th className="text-left py-2 text-xs text-muted-foreground">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {mockLabResults.slice(0, 6).map((r) => (
                    <tr key={r.parameter} className="border-b border-border/40">
                      <td className="py-2 font-medium text-sm">{r.parameter}</td>
                      <td className="py-2 text-right text-sm font-semibold">{r.result}</td>
                      <td className="py-2 text-xs text-muted-foreground">{r.unit}</td>
                      <td className="py-2 text-xs text-muted-foreground">{r.reference}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Contributing factors */}
          <div>
            <h3 className="text-sm font-bold mb-3">Key Contributing Factors</h3>
            <div className="space-y-2">
              {mockContributionFactors.map((factor) => (
                <div key={factor.name} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-32 flex-shrink-0">{factor.name}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={factor.contribution > 60 ? 'bg-warning' : 'bg-success'}
                      style={{ width: `${factor.contribution}%`, height: '100%', borderRadius: '9999px' }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-20 text-right">{factor.value} ({factor.contribution}%)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cross-signal insights */}
          <div>
            <h3 className="text-sm font-bold mb-3">Cross-Signal Insights</h3>
            <div className="space-y-2">
              {mockCrossSignalInsights.map((insight) => (
                <div key={insight.title} className="rounded-lg border border-border p-3">
                  <p className="text-sm font-semibold">{insight.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{insight.result}</p>
                  <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Discussion points */}
          <div>
            <h3 className="text-sm font-bold mb-2">Discussion Points for Healthcare Provider</h3>
            <ul className="space-y-1.5">
              {['HbA1c trend and potential screening frequency', 'Whether CGM-guided lifestyle changes are appropriate', 'Family history implications for screening schedule', 'Post-meal glucose patterns and dietary adjustments'].map((point) => (
                <li key={point} className="flex items-start gap-2 text-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* Data quality */}
          <div>
            <h3 className="text-sm font-bold mb-2">Data Quality</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Overall Completeness</p>
                <p className="text-lg font-bold">82%</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Sources Connected</p>
                <p className="text-lg font-bold">4 / 6</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Model Confidence</p>
                <p className="text-lg font-bold">87.3%</p>
              </div>
            </div>
          </div>

          <MedicalDisclaimer />
        </CardContent>
      </Card>

      {/* Report sections overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Report Sections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {reportSections.map((section) => (
              <div key={section.num} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-bold">
                  {section.num}
                </span>
                <span className="text-sm flex-1">{section.title}</span>
                <CheckCircle2 className={section.status === 'complete' ? 'h-4 w-4 text-success' : 'h-4 w-4 text-warning'} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
