import { Header } from '@/components/shared/header';
import { Footer } from '@/components/shared/footer';
import { TrustSection } from '@/components/home/trust-section';
import {
  Target,
  Eye,
  Zap,
  Brain,
  Boxes,
  GitMerge,
  ArrowRight,
  Building2,
  ShieldCheck,
} from 'lucide-react';

const techTree = [
  { label: 'Multimodal AI', icon: Brain },
  { label: 'Machine Learning', icon: Boxes },
  { label: 'Deep Learning', icon: Brain },
  { label: 'Explainable AI', icon: Eye },
  { label: 'Causal Analysis', icon: Zap },
  { label: 'Knowledge-Based AI', icon: ShieldCheck },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-mesh border-b border-border/60">
          <div className="absolute inset-0 bg-grid-pattern opacity-30" />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
                Building Intelligence for Metabolic Health
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Synora Health is building technology that brings together fragmented health
                information to help people and healthcare professionals understand metabolic health
                through a more connected lens.
              </p>
            </div>
          </div>
        </section>

        {/* Vision & Mission */}
        <section className="py-16 lg:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                  <Eye className="h-6 w-6" />
                </div>
                <h3 className="font-display text-xl font-bold">Our Vision</h3>
                <p className="mt-2 text-muted-foreground leading-relaxed">
                  A future where health data doesn&rsquo;t live in isolated systems.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent mb-4">
                  <Target className="h-6 w-6" />
                </div>
                <h3 className="font-display text-xl font-bold">Our Mission</h3>
                <p className="mt-2 text-muted-foreground leading-relaxed">
                  To transform complex metabolic health data into understandable, explainable
                  intelligence.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Technology Story */}
        <section className="border-t border-border/60 bg-muted/20 py-16 lg:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="font-display text-3xl font-bold tracking-tight">
                From Data Fragmentation to Health Intelligence
              </h2>
              <p className="mt-3 text-muted-foreground">The Synora Health technology story</p>
            </div>

            <div className="mt-12 flex flex-col items-center gap-4">
              {/* Brand hierarchy */}
              <div className="flex flex-col items-center gap-3">
                <div className="rounded-xl border-2 border-primary bg-primary/10 px-6 py-3 text-center">
                  <p className="font-display font-bold text-lg text-primary">METABONEXA</p>
                  <p className="text-xs text-muted-foreground">Health Technology Company</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground rotate-90" />
                <div className="rounded-xl border-2 border-accent bg-accent/10 px-6 py-3 text-center">
                  <p className="font-display font-bold text-lg text-accent">GENOGLUCO</p>
                  <p className="text-xs text-muted-foreground">AI Diabetes Health Platform</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground rotate-90" />
                <div className="rounded-xl border-2 border-foreground/20 bg-foreground/5 px-6 py-3 text-center">
                  <p className="font-display font-bold text-lg">NEXAFUSION AI&trade;</p>
                  <p className="text-xs text-muted-foreground">Multimodal AI Intelligence</p>
                </div>
              </div>

              {/* Tech capabilities */}
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {techTree.map((tech) => {
                  const Icon = tech.icon;
                  return (
                    <div key={tech.label} className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2">
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{tech.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Trust & Transparency */}
        <section id="trust" className="border-t border-border/60 py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="font-display text-3xl font-bold tracking-tight">
                Built With Transparency in Mind
              </h2>
              <p className="mt-3 text-muted-foreground">
                How we handle your data with integrity and accountability
              </p>
            </div>
            <div className="mt-12">
              <TrustSection />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
