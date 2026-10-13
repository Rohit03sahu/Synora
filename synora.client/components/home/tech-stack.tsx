'use client';

import { useState } from 'react';
import {
  Layers,
  Database,
  Settings2,
  Cpu,
  Brain,
  FileOutput,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const layers = [
  {
    id: 'data',
    title: 'Data',
    icon: Database,
    items: ['EHR', 'Lab Reports', 'CGM', 'Genomics', 'Insulin Pump', 'Fitness', 'Lifestyle'],
    color: 'text-chart-1',
    bg: 'bg-chart-1/10',
    border: 'border-chart-1/30',
  },
  {
    id: 'engineering',
    title: 'Data Engineering',
    icon: Settings2,
    items: ['Data Validation', 'Missing Data Handling', 'Normalization', 'Timestamp Alignment', 'Semantic Harmonization', 'Feature Extraction'],
    color: 'text-chart-2',
    bg: 'bg-chart-2/10',
    border: 'border-chart-2/30',
  },
  {
    id: 'models',
    title: 'AI Models',
    icon: Cpu,
    items: ['Logistic Regression', 'Random Forest', 'XGBoost', 'SVM', 'LSTM', 'GRU', 'Transformers', 'Time-Series Models'],
    subGroups: [
      { name: 'Classical ML', items: ['Logistic Regression', 'Random Forest', 'XGBoost', 'SVM'] },
      { name: 'Deep Learning', items: ['LSTM', 'GRU', 'Transformers', 'Time-Series Models'] },
      { name: 'Multimodal AI', items: ['Feature Fusion', 'Representation Fusion', 'Decision Fusion'] },
    ],
    color: 'text-chart-3',
    bg: 'bg-chart-3/10',
    border: 'border-chart-3/30',
  },
  {
    id: 'intelligence',
    title: 'Intelligence',
    icon: Brain,
    items: ['Risk Prediction', 'Pattern Detection', 'Trend Analysis', 'Explainable AI', 'Causal Analysis', 'Knowledge-Based AI'],
    color: 'text-chart-4',
    bg: 'bg-chart-4/10',
    border: 'border-chart-4/30',
  },
  {
    id: 'output',
    title: 'Output',
    icon: FileOutput,
    items: ['Risk Assessment', 'Key Factors', 'Trend Insights', 'Explainable Results', 'Patient Report', 'Doctor Report'],
    color: 'text-chart-5',
    bg: 'bg-chart-5/10',
    border: 'border-chart-5/30',
  },
];

export function TechStackDiagram() {
  const [activeLayer, setActiveLayer] = useState('data');

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
      <div className="space-y-2">
        {layers.map((layer, i) => {
          const Icon = layer.icon;
          const isActive = activeLayer === layer.id;
          return (
            <div key={layer.id}>
              <button
                onClick={() => setActiveLayer(layer.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all',
                  isActive
                    ? `${layer.border} ${layer.bg} shadow-sm`
                    : 'border-border bg-card hover:border-border/80 hover:bg-muted/40'
                )}
              >
                <div className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-md transition-colors',
                  isActive ? `${layer.bg} ${layer.color}` : 'bg-muted text-muted-foreground'
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <span className="text-xs font-bold text-muted-foreground">
                    Layer {i + 1}
                  </span>
                  <p className={cn('text-sm font-semibold', isActive && layer.color)}>
                    {layer.title}
                  </p>
                </div>
                <ChevronRight className={cn(
                  'h-4 w-4 transition-transform',
                  isActive ? 'translate-x-0 text-foreground' : '-translate-x-2 text-transparent'
                )} />
              </button>
              {i < layers.length - 1 && (
                <div className="ml-[26px] h-3 w-px bg-border" />
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-card p-6 min-h-[400px]">
        {layers.map((layer) => {
          if (layer.id !== activeLayer) return null;
          const Icon = layer.icon;
          return (
            <div key={layer.id} className="animate-fade-in-up">
              <div className="mb-6 flex items-center gap-3">
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg', layer.bg, layer.color)}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold">{layer.title}</h4>
                  <p className="text-sm text-muted-foreground">Layer {layers.indexOf(layer) + 1} of {layers.length}</p>
                </div>
              </div>

              {layer.subGroups ? (
                <div className="space-y-4">
                  {layer.subGroups.map((group) => (
                    <div key={group.name}>
                      <h5 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {group.name}
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {group.items.map((item) => (
                          <span
                            key={item}
                            className={cn(
                              'rounded-lg border px-3 py-1.5 text-xs font-medium',
                              layer.border, layer.bg, layer.color
                            )}
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {layer.items.map((item) => (
                    <span
                      key={item}
                      className={cn(
                        'rounded-lg border px-3 py-1.5 text-xs font-medium',
                        layer.border, layer.bg, layer.color
                      )}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
