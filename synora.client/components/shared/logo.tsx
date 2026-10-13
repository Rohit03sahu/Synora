import { Heart, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SynoraHealthLogo({
  className,
  showText = true,
  size = 'default',
}: {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'default' | 'lg';
}) {
  const iconSize = size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6';
  const textSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-xl' : 'text-lg';

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 rounded-lg bg-primary/20 blur-md" />
        <div className="relative flex items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground p-1.5 shadow-sm">
          <Activity className={iconSize} strokeWidth={2.5} />
        </div>
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn('font-display font-extrabold tracking-tight', textSize)}>
            Synora Health
          </span>
          <span className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground mt-0.5">
            GenoGluco
          </span>
        </div>
      )}
    </div>
  );
}

export function GenoGlucoLogo({
  className,
  showText = true,
  size = 'default',
}: {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'default' | 'lg';
}) {
  const iconSize = size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6';
  const textSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-xl' : 'text-lg';

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 rounded-lg bg-primary/20 blur-md" />
        <div className="relative flex items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground p-1.5 shadow-sm">
          <Heart className={iconSize} strokeWidth={2.5} />
        </div>
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn('font-display font-extrabold tracking-tight', textSize)}>
            GenoGluco
          </span>
          <span className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground mt-0.5">
            Powered by Synora Intelligence
          </span>
        </div>
      )}
    </div>
  );
}
