import { MedicalDisclaimer } from '@/components/shared/medical-disclaimer';
import Link from 'next/link';
import { Activity } from 'lucide-react';

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left panel - branding */}
      <div className="relative flex flex-col justify-between bg-gradient-to-br from-primary to-accent p-8 text-white lg:w-1/2 lg:p-12">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="relative">
          <Link href="/">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center rounded-lg bg-white/20 p-1.5">
                <Activity className="h-6 w-6" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-display font-extrabold text-lg">Synora Health</span>
                <span className="text-[10px] font-medium tracking-wider uppercase opacity-80 mt-0.5">
                  GenoGluco
                </span>
              </div>
            </div>
          </Link>
        </div>

        <div className="relative space-y-6">
          <h2 className="font-display text-3xl font-bold leading-tight">
            Intelligence for a Healthier Metabolic Future
          </h2>
          <p className="text-white/80 leading-relaxed">
            GenoGluco connects clinical, glucose, genomic, and lifestyle data through Synora Intelligence&trade; to generate personalized, explainable diabetes risk insights.
          </p>
          <div className="flex flex-wrap gap-2">
            {['Explainable AI', 'Multimodal Fusion', 'Personal Reports', 'Cross-Signal Insights'].map((tag) => (
              <span key={tag} className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="relative text-xs text-white/60">
          <p>Powered by Synora Intelligence&trade;</p>
          <p className="mt-1">&copy; 2026 Synora Health. All rights reserved.</p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex flex-1 items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
          {footer}
          <MedicalDisclaimer variant="compact" className="pt-4" />
        </div>
      </div>
    </div>
  );
}
