import Link from 'next/link';
import {
  ArrowRight,
  Sparkles,
  Activity,
  Brain,
  Eye,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Header } from '@/components/shared/header';
import { Footer } from '@/components/shared/footer';
import { MedicalDisclaimer } from '@/components/shared/medical-disclaimer';
import { HeroVisualization } from '@/components/home/hero-visualization';
import { SignalCards } from '@/components/home/signal-cards';
import { AIPipeline } from '@/components/home/ai-pipeline';
import { TechStackDiagram } from '@/components/home/tech-stack';
import { SolutionsSection } from '@/components/home/solutions-section';
import { HowItWorksJourney } from '@/components/home/how-it-works';
import { TrustSection } from '@/components/home/trust-section';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-mesh">
          <div className="absolute inset-0 bg-grid-pattern opacity-30" />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  Powered by Synora Intelligence&trade;
                </div>
                <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-balance sm:text-5xl lg:text-6xl">
                  Understand Diabetes Risk Through the Full Picture of Your Health
                </h1>
                <p className="max-w-xl text-lg text-muted-foreground leading-relaxed">
                  GenoGluco brings together clinical data, laboratory results, CGM, insulin,
                  genomics and lifestyle information to generate personalized, explainable health
                  insights powered by Synora Intelligence&trade;.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button size="lg" asChild>
                    <Link href="/get-started">
                      Start Your GenoGluco Assessment
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link href="/technology">
                      Explore Synora Intelligence
                    </Link>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Powered by <span className="font-semibold text-foreground">Synora Health</span>
                </p>
              </div>

              <div className="flex justify-center">
                <HeroVisualization />
              </div>
            </div>
          </div>
        </section>

        {/* What is GenoGluco */}
        <section className="border-t border-border/60 py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                What is GenoGluco?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                One Platform. Multiple Health Signals. A More Complete View.
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Traditional diabetes assessment can involve individual measurements. GenoGluco is
                designed to bring different available signals together for a more connected
                understanding of metabolic health.
              </p>
            </div>

            <div className="mt-12">
              <SignalCards />
            </div>

            {/* Flow diagram */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-2 text-sm font-medium">
              {['Clinical', 'Laboratory', 'CGM', 'Insulin', 'Genomics', 'Lifestyle'].map((item, i, arr) => (
                <div key={item} className="flex items-center gap-2">
                  <span className="rounded-lg border border-border bg-card px-3 py-1.5">{item}</span>
                  {i < arr.length - 1 && <span className="text-primary font-bold">+</span>}
                </div>
              ))}
              <ArrowRight className="h-4 w-4 text-primary" />
              <span className="rounded-lg border border-primary bg-primary/10 px-3 py-1.5 font-semibold text-primary">GENOGLUCO</span>
              <ArrowRight className="h-4 w-4 text-primary" />
              <span className="rounded-lg border border-accent bg-accent/10 px-3 py-1.5 font-semibold text-accent">SYNORA INTELLIGENCE&trade;</span>
              <ArrowRight className="h-4 w-4 text-primary" />
              <span className="rounded-lg border border-success bg-success/10 px-3 py-1.5 font-semibold text-success">PERSONALIZED INSIGHTS</span>
            </div>
          </div>
        </section>

        {/* What is Synora Intelligence */}
        <section className="border-t border-border/60 bg-muted/20 py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-medium text-accent">
                  <Brain className="h-3.5 w-3.5" />
                  Technology
                </div>
                <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  Meet Synora Intelligence&trade;
                </h2>
                <p className="text-lg text-muted-foreground">
                  The intelligence layer behind GenoGluco
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Synora Intelligence is designed to combine heterogeneous health information and apply
                  appropriate AI/ML techniques to identify patterns, relationships and risk signals
                  across multiple data modalities.
                </p>
                <div className="flex flex-wrap gap-3">
                  {['Multimodal AI', 'Machine Learning', 'Deep Learning', 'Explainable AI', 'Causal Analysis', 'Knowledge-Based AI'].map((tag) => (
                    <span key={tag} className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <AIPipeline />
              </div>
            </div>
          </div>
        </section>

        {/* Tech Stack */}
        <section className="border-t border-border/60 py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Synora Intelligence Technology Stack
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Five layers of intelligence from raw data to explainable insights
              </p>
            </div>
            <div className="mt-12">
              <TechStackDiagram />
            </div>
          </div>
        </section>

        {/* Solutions */}
        <section className="border-t border-border/60 bg-muted/20 py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                GenoGluco Solutions
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Tailored experiences for every type of user
              </p>
            </div>
            <div className="mt-12">
              <SolutionsSection />
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="border-t border-border/60 py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                How GenoGluco Works
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                A five-stage journey from sign-up to understanding your results
              </p>
            </div>
            <div className="mt-12">
              <HowItWorksJourney />
            </div>
          </div>
        </section>

        {/* Trust & Transparency */}
        <section className="border-t border-border/60 bg-muted/20 py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-success/20 bg-success/5 px-3 py-1 text-xs font-medium text-success">
                <ShieldCheck className="h-3.5 w-3.5" />
                Trust &amp; Transparency
              </div>
              <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Built With Transparency in Mind
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                From your data to your results, every step is designed to be clear and accountable
              </p>
            </div>
            <div className="mt-12">
              <TrustSection />
            </div>
          </div>
        </section>

        {/* Core Brand Message */}
        <section className="border-t border-border/60 py-16 lg:py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="space-y-8 text-center">
              <div>
                <h3 className="font-display text-2xl font-bold">Synora Health</h3>
                <p className="mt-1 text-lg text-primary">Intelligence for a Healthier Metabolic Future</p>
              </div>
              <div className="flex justify-center">
                <ArrowRight className="h-5 w-5 text-muted-foreground rotate-90" />
              </div>
              <div>
                <h3 className="font-display text-2xl font-bold">GenoGluco</h3>
                <p className="mt-1 text-lg text-accent">Connecting the Signals Behind Diabetes Risk</p>
              </div>
              <div className="flex justify-center">
                <ArrowRight className="h-5 w-5 text-muted-foreground rotate-90" />
              </div>
              <div>
                <h3 className="font-display text-2xl font-bold">Powered by Synora Intelligence&trade;</h3>
                <p className="mt-1 text-lg text-foreground">
                  Multimodal intelligence for explainable metabolic health insights.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Medical Disclaimer */}
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
