'use client';

import { useEffect, useState } from 'react';
import {
  FileText,
  Droplet,
  Dna,
  Watch,
  Activity,
  FlaskConical,
  Sparkles,
  Brain,
  TrendingUp,
} from 'lucide-react';

const dataSources = [
  { id: 'ehr', label: 'EHR / Clinical', icon: FileText, angle: 0 },
  { id: 'cgm', label: 'CGM', icon: Activity, angle: 60 },
  { id: 'genomics', label: 'Genomics', icon: Dna, angle: 120 },
  { id: 'insulin', label: 'Insulin / Device', icon: Watch, angle: 180 },
  { id: 'lifestyle', label: 'Lifestyle', icon: TrendingUp, angle: 240 },
  { id: 'lab', label: 'Laboratory', icon: FlaskConical, angle: 300 },
];

const insightCards = [
  { label: 'Key Factors', icon: TrendingUp, delay: '0s' },
  { label: 'Trends', icon: Activity, delay: '0.2s' },
  { label: 'Explanation', icon: Sparkles, delay: '0.4s' },
  { label: 'Insights', icon: Brain, delay: '0.6s' },
];

export function HeroVisualization() {
  const [activeSource, setActiveSource] = useState(0);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const sourceInterval = setInterval(() => {
      setActiveSource((prev) => (prev + 1) % dataSources.length);
    }, 2000);

    const resultsTimeout = setTimeout(() => setShowResults(true), 1500);

    return () => {
      clearInterval(sourceInterval);
      clearTimeout(resultsTimeout);
    };
  }, []);

  return (
    <div className="relative mx-auto flex aspect-square w-full max-w-[560px] items-center justify-center">
      {/* Background rings */}
      <div className="absolute inset-0 rounded-full border border-primary/10" />
      <div className="absolute inset-[12%] rounded-full border border-primary/10" />
      <div className="absolute inset-[24%] rounded-full border border-primary/10" />
      <div className="absolute inset-[36%] rounded-full border-2 border-primary/20 animate-pulse-glow" />

 {/* Animated connection lines */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 400">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {dataSources.map((source, i) => {
          const radius = 42;
          const rad = (source.angle * Math.PI) / 180;
          const x = 200 + Math.cos(rad) * radius * 3.2;
          const y = 200 + Math.sin(rad) * radius * 3.2;
          const isActive = i === activeSource;
          return (
            <line
              key={source.id}
              x1={x}
              y1={y}
              x2="200"
              y2="200"
              stroke="url(#lineGradient)"
              strokeWidth={isActive ? 2.5 : 1}
              strokeDasharray="4 4"
              opacity={isActive ? 1 : 0.3}
              style={{ transition: 'all 0.5s ease' }}
            />
          );
        })}
      </svg>

      {/* Data source nodes */}
      {dataSources.map((source, i) => {
        const Icon = source.icon;
        const radius = 42;
        const rad = (source.angle * Math.PI) / 180;
        const x = `${50 + (Math.cos(rad) * radius * 3.2) / 4}%`;
        const y = `${50 + (Math.sin(rad) * radius * 3.2) / 4}%`;
        const isActive = i === activeSource;

        return (
          <div
            key={source.id}
            className="absolute flex flex-col items-center gap-1.5 transition-all duration-500"
            style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl border shadow-sm transition-all duration-500 ${
                isActive
                  ? 'border-primary bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/20'
                  : 'border-border bg-card text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <span
              className={`text-[10px] font-medium transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {source.label}
            </span>
          </div>
        );
      })}

      {/* Central AI core */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-xl shadow-primary/30">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse-glow blur-md" />
          <div className="relative z-10 flex flex-col items-center gap-1">
            <Brain className="h-7 w-7" />
            <span className="text-[8px] font-bold uppercase tracking-wider">Synora Intelligence</span>
            <span className="text-[7px] opacity-80">AI&trade;</span>
          </div>
        </div>

        {/* Processing rings */}
        <div className="absolute inset-0 -m-4 rounded-full border-2 border-primary/20 border-t-primary/60 animate-spin" style={{ animationDuration: '4s' }} />
      </div>

      {/* Output insight cards */}
      {showResults && (
        <div className="absolute -bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {insightCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-md animate-scale-in"
                style={{ animationDelay: card.delay, opacity: 0 }}
              >
                <Icon className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-semibold whitespace-nowrap">{card.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
