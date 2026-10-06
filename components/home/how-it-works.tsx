import { UserPlus, ClipboardList, Plug, BrainCircuit, FileBarChart } from 'lucide-react';
import { cn } from '@/lib/utils';

const stages = [
  {
    num: '01',
    title: 'Create Your Account',
    icon: UserPlus,
    steps: ['Sign Up', 'Authentication', 'Consent'],
    color: 'from-chart-1 to-chart-2',
  },
  {
    num: '02',
    title: 'Tell Us About Yourself',
    icon: ClipboardList,
    steps: ['Health Survey', 'Medical History', 'Family History', 'Lifestyle'],
    color: 'from-chart-2 to-chart-4',
  },
  {
    num: '03',
    title: 'Connect Your Health Data',
    icon: Plug,
    steps: ['Lab', 'CGM', 'Genomics', 'Insulin Pump', 'Lifestyle'],
    color: 'from-chart-4 to-chart-3',
  },
  {
    num: '04',
    title: 'Synora Intelligence Analysis',
    icon: BrainCircuit,
    steps: ['Data Harmonization', 'AI/ML Models', 'Multimodal Fusion', 'Risk Assessment'],
    color: 'from-chart-3 to-chart-5',
  },
  {
    num: '05',
    title: 'Understand Your Results',
    icon: FileBarChart,
    steps: ['Assessment', 'Why?', 'Contributing Factors', 'Trends', 'Explainable Insights', 'Report'],
    color: 'from-chart-5 to-chart-6',
  },
];

export function HowItWorksJourney() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-5">
      {stages.map((stage, i) => {
        const Icon = stage.icon;
        return (
          <div key={stage.num} className="relative">
            <div className="rounded-xl border border-border bg-card p-5 transition-all hover:shadow-lg hover:border-primary/30">
              <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-md', stage.color)}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="mt-4">
                <span className="text-xs font-bold text-muted-foreground">{stage.num}</span>
                <h4 className="text-sm font-semibold mt-0.5">{stage.title}</h4>
              </div>
              <ul className="mt-3 space-y-1">
                {stage.steps.map((step) => (
                  <li key={step} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="h-1 w-1 rounded-full bg-primary/60" />
                    {step}
                  </li>
                ))}
              </ul>
            </div>
            {i < stages.length - 1 && (
              <div className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-border lg:block">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
