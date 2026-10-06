'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Database,
  ShieldCheck,
  SlidersHorizontal,
  Boxes,
  Brain,
  GitMerge,
  ClipboardCheck,
  Eye,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const pipeline = [
  { id: 1, label: 'Data Ingestion', icon: Database, desc: 'Connect and collect heterogeneous health data sources' },
  { id: 2, label: 'Data Quality', icon: ShieldCheck, desc: 'Validate and assess completeness of incoming data' },
  { id: 3, label: 'Normalization', icon: SlidersHorizontal, desc: 'Standardize units, ranges, and formats across sources' },
  { id: 4, label: 'Feature Engineering', icon: Boxes, desc: 'Extract meaningful features from each data modality' },
  { id: 5, label: 'Modality-Specific AI', icon: Brain, desc: 'Apply specialized models per data type' },
  { id: 6, label: 'Multimodal Fusion', icon: GitMerge, desc: 'Combine insights across all modalities' },
  { id: 7, label: 'Risk Assessment', icon: ClipboardCheck, desc: 'Generate diabetes risk evaluation from fused data' },
  { id: 8, label: 'Explainable AI', icon: Eye, desc: 'Provide transparent reasoning for every assessment' },
  { id: 9, label: 'Personalized Insights', icon: Sparkles, desc: 'Deliver actionable, individualized health insights' },
];

export function AIPipeline() {
  const [activeStep, setActiveStep] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!inView) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % pipeline.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [inView]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setInView(true),
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={sectionRef} className="space-y-3">
      {pipeline.map((step, i) => {
        const Icon = step.icon;
        const isActive = activeStep === i;
        const isPast = activeStep > i;
        return (
          <div key={step.id}>
            <div
              className={cn(
                'flex items-center gap-4 rounded-xl border p-4 transition-all duration-500',
                isActive
                  ? 'border-primary bg-primary/5 shadow-md shadow-primary/10 scale-[1.02]'
                  : isPast
                  ? 'border-success/30 bg-success/5'
                  : 'border-border bg-card'
              )}
            >
              <div
                className={cn(
                  'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg transition-all',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : isPast
                    ? 'bg-success/15 text-success'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground">
                    {String(step.id).padStart(2, '0')}
                  </span>
                  <h4 className="text-sm font-semibold">{step.label}</h4>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{step.desc}</p>
              </div>
              {isActive && (
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-primary animate-bounce" />
                  <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              )}
            </div>
            {i < pipeline.length - 1 && (
              <div className="ml-[34px] flex h-4 w-px items-center justify-center">
                <div className={cn(
                  'h-full w-px transition-colors duration-500',
                  isPast || isActive ? 'bg-primary/40' : 'bg-border'
                )} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
