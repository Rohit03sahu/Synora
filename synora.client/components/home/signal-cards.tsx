'use client';

import { useState } from 'react';
import {
  FileText,
  FlaskConical,
  Activity,
  Dna,
  Watch,
  TrendingUp,
  ArrowRight,
  Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const signals = [
  {
    id: 'clinical',
    title: 'Clinical Health',
    icon: FileText,
    description: 'Electronic health records, medical history, diagnoses, medications, and clinical assessments.',
    items: ['Medical history', 'Diagnoses', 'Medications', 'Vitals'],
  },
  {
    id: 'lab',
    title: 'Laboratory',
    icon: FlaskConical,
    description: 'Blood tests including HbA1c, fasting glucose, lipid profiles, kidney markers, and more.',
    items: ['HbA1c', 'Fasting glucose', 'Lipid profile', 'eGFR'],
  },
  {
    id: 'glucose',
    title: 'Glucose',
    icon: Activity,
    description: 'Continuous glucose monitoring data for trends, variability, time-in-range, and patterns.',
    items: ['CGM trends', 'Time in range', 'Variability', 'Patterns'],
  },
  {
    id: 'genomics',
    title: 'Genomics',
    icon: Dna,
    description: 'Genetic variants, SNPs, polygenic risk scores, and family history context.',
    items: ['SNPs', 'Variants', 'Polygenic risk', 'Family history'],
  },
  {
    id: 'insulin',
    title: 'Insulin & Devices',
    icon: Watch,
    description: 'Insulin pump data, basal/bolus delivery, wearable device data, and device metrics.',
    items: ['Basal rates', 'Bolus data', 'Correction doses', 'Device metrics'],
  },
  {
    id: 'lifestyle',
    title: 'Lifestyle',
    icon: TrendingUp,
    description: 'Diet, physical activity, sleep patterns, stress levels, and smoking habits.',
    items: ['Diet', 'Activity', 'Sleep', 'Stress'],
  },
];

export function SignalCards() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {signals.map((signal) => {
        const Icon = signal.icon;
        const isActive = active === signal.id;
        return (
          <Card
            key={signal.id}
            className={cn(
              'group cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-primary/40',
              isActive && 'border-primary shadow-lg shadow-primary/10'
            )}
            onClick={() => setActive(isActive ? null : signal.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base font-semibold">{signal.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">{signal.description}</p>
              {isActive && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 animate-fade-in-up">
                  {signal.items.map((item) => (
                    <div key={item} className="flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-success" />
                      <span className="text-xs font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
