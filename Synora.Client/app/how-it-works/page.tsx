import { Header } from '@/components/shared/header';
import { Footer } from '@/components/shared/footer';
import { MedicalDisclaimer } from '@/components/shared/medical-disclaimer';
import { HowItWorksJourney } from '@/components/home/how-it-works';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-mesh border-b border-border/60">
          <div className="absolute inset-0 bg-grid-pattern opacity-30" />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
                How GenoGluco Works
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                A five-stage journey from creating your account to understanding your personalized
                results.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <HowItWorksJourney />
          </div>
        </section>

        {/* Detailed stages */}
        <section className="border-t border-border/60 bg-muted/20 py-16 lg:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-8">
            <h2 className="font-display text-3xl font-bold tracking-tight text-center">Detailed Journey</h2>

            {[
              { num: '01', title: 'Create Your Account', steps: ['Sign Up', 'Authentication', 'Consent'], desc: 'Register with GenoGluco, verify your identity, and provide consent for health data processing.' },
              { num: '02', title: 'Tell Us About Yourself', steps: ['Health Survey', 'Medical History', 'Family History', 'Lifestyle'], desc: 'Complete a conversational questionnaire covering your health, medical history, family background, and lifestyle.' },
              { num: '03', title: 'Connect Your Health Data', steps: ['Lab', 'CGM', 'Genomics', 'Insulin Pump', 'Lifestyle'], desc: 'Upload lab reports, connect CGM and insulin devices, add genomic data, and link lifestyle apps.' },
              { num: '04', title: 'Synora Intelligence Analysis', steps: ['Multiple Data Sources', 'Data Harmonization', 'AI/ML Models', 'Multimodal Fusion', 'Risk Assessment'], desc: 'Synora Intelligence processes and harmonizes your data, applies specialized models, and performs multimodal fusion to generate a risk assessment.' },
              { num: '05', title: 'Understand Your Results', steps: ['Assessment', 'Why?', 'Contributing Factors', 'Trends', 'Explainable Insights', 'Report'], desc: 'Review your personalized assessment, understand the contributing factors, explore trends, and download a comprehensive report.' },
            ].map((stage) => (
              <div key={stage.num} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 sm:flex-row sm:items-start">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                  {stage.num}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{stage.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{stage.desc}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {stage.steps.map((step, i, arr) => (
                      <div key={step} className="flex items-center gap-2">
                        <span className="rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium">{step}</span>
                        {i < arr.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-border/60 py-16 text-center">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 space-y-4">
            <h2 className="font-display text-2xl font-bold">Ready to Begin?</h2>
            <p className="text-muted-foreground">Start your GenoGluco assessment today.</p>
            <Button size="lg" asChild>
              <Link href="/get-started">
                Start Your GenoGluco Assessment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="border-t border-border/60 bg-muted/20 py-12">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <MedicalDisclaimer />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
