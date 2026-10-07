import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MedicalDisclaimer({
  className,
  variant = 'full',
}: {
  className?: string;
  variant?: 'full' | 'compact';
}) {
  if (variant === 'compact') {
    return (
      <p className={cn('text-xs text-muted-foreground leading-relaxed', className)}>
        AI-generated results are not a substitute for professional medical advice. Consult a
        qualified healthcare professional for medical decisions.
      </p>
    );
  }

  return (
    <div
      className={cn(
        'flex gap-3 rounded-lg border border-warning/30 bg-warning/5 p-4',
        className
      )}
    >
      <AlertCircle className="h-5 w-5 flex-shrink-0 text-warning mt-0.5" />
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">Medical Disclaimer</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          GenoGluco provides health information and risk-assessment insights based on available
          data. AI-generated results are not a substitute for professional medical diagnosis,
          treatment, or advice. Users should consult an appropriately qualified healthcare
          professional for medical decisions.
        </p>
      </div>
    </div>
  );
}
