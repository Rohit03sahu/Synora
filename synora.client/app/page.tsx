import Link from 'next/link';
import {
  ArrowRight,
  Sparkles,
  Clock3,
  FileText,
  ShieldCheck,
  UserRound,
  Stethoscope,
  Building2,
} from 'lucide-react';
import { Header } from '@/components/shared/header';
import { Footer } from '@/components/shared/footer';
import { MedicalDisclaimer } from '@/components/shared/medical-disclaimer';
import { TrustSection } from '@/components/home/trust-section';
import { Button } from '@/components/ui/button';

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
                  GenoGluco by Synora Health
                </div>
                <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-balance sm:text-5xl lg:text-6xl">
                  Organize Your Health Information for a Better Clinical Conversation
                </h1>
                <p className="max-w-xl text-lg text-muted-foreground leading-relaxed">
                  Build a health profile, keep track of the information you have entered, and
                  prepare questions for your next conversation with a clinician.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button size="lg" asChild>
                    <Link href="/get-started?role=patient">
                      Start profile setup
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link href="#sample-report">
                      <FileText className="mr-2 h-4 w-4" />
                      View a sample report
                    </Link>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  No CGM, genomic test, or connected device is required to create a profile.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card/90 p-6 shadow-lg sm:p-8">
                <div className="flex items-start justify-between gap-4 border-b border-border pb-5">
                  <div>
                    <p className="eyebrow">Your first step</p>
                    <h2 className="mt-2 font-display text-2xl font-bold">A useful starting point</h2>
                  </div>
                  <Clock3 className="h-6 w-6 flex-shrink-0 text-primary" aria-hidden="true" />
                </div>
                <div className="grid gap-5 pt-5 sm:grid-cols-3">
                  <div><p className="text-sm font-semibold">About 10 minutes</p><p className="mt-1 text-sm text-muted-foreground">Estimated time for the profile questionnaire.</p></div>
                  <div><p className="text-sm font-semibold">What you need</p><p className="mt-1 text-sm text-muted-foreground">Name, email, and password. Profile questions are optional; answer what you know.</p></div>
                  <div><p className="text-sm font-semibold">What you get today</p><p className="mt-1 text-sm text-muted-foreground">A saved health profile and health-record summary. Automated assessment generation is not connected yet.</p></div>
                </div>
                <p className="mt-5 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">CGM, genomic data, insulin-pump data, lab uploads, and lifestyle details are optional. You can skip information you do not know. Pricing and free-pilot terms are not published on this site.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="sample-report" className="scroll-mt-20 border-t border-border/60 py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
              <div className="space-y-4">
                <p className="eyebrow">Illustrative example only</p>
                <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">See one way a health summary could be organized.</h2>
                <p className="text-muted-foreground">Automated assessment generation is not currently available. This fictional example is a design illustration, not a live GenoGluco result, risk score, or prediction.</p>
                <Link href="/evidence" className="inline-flex items-center font-medium text-primary hover:underline">Read evidence and limitations <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </div>
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/30 px-5 py-4">
                  <div><p className="text-sm font-semibold">Illustrative metabolic health summary</p><p className="text-xs text-muted-foreground">Fictional example · values shown for demonstration only</p></div>
                  <span className="rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs font-semibold text-foreground">Needs clinician context</span>
                </div>
                <div className="grid gap-5 p-5 sm:grid-cols-2">
                  <div><h3 className="text-sm font-semibold">Contributing information <span className="font-normal text-muted-foreground">(not proof of cause)</span></h3><ul className="mt-3 space-y-2 text-sm text-muted-foreground"><li>HbA1c: 6.1% (example value)</li><li>Fasting glucose: 108 mg/dL (example value)</li><li>Self-reported family history: yes</li></ul></div>
                  <div><h3 className="text-sm font-semibold">Data gaps</h3><ul className="mt-3 space-y-2 text-sm text-muted-foreground"><li>No result dates or prior trend available</li><li>No CGM data provided</li><li>Medication and clinical context not confirmed</li></ul></div>
                  <div className="sm:col-span-2 border-t border-border pt-4"><h3 className="text-sm font-semibold">Possible next steps to discuss</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Confirm the source and date of the lab results, review them with your healthcare professional, and ask whether follow-up testing is appropriate. This example does not recommend treatment or medication changes.</p></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-border/60 bg-muted/20 py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center"><p className="eyebrow">Choose your next step</p><h2 className="mt-3 font-display text-3xl font-bold tracking-tight">Start from what you need</h2></div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: 'For myself', text: 'Build a health profile and review information you have entered.', action: 'Start profile setup', href: '/get-started?role=patient', icon: UserRound },
                { title: 'For my patients', text: 'Request clinical access through your organization.', action: 'Request clinical access', href: '/contact#clinical-access', icon: Stethoscope },
                { title: 'For my hospital', text: 'See whether GenoGluco fits your clinical program.', action: 'Book a demo', href: '/contact#demo', icon: Building2 },
                { title: 'For my wellness organization', text: 'Discuss an organization-level wellness program.', action: 'Book a demo', href: '/contact#demo', icon: Building2 },
              ].map((journey) => {
                const Icon = journey.icon;
                return <div key={journey.title} className="flex flex-col border-t-2 border-primary bg-card p-5"><Icon className="h-5 w-5 text-primary" aria-hidden="true" /><h3 className="mt-4 font-semibold">{journey.title}</h3><p className="mt-2 flex-1 text-sm text-muted-foreground">{journey.text}</p><Link href={journey.href} className="mt-5 inline-flex items-center text-sm font-semibold text-primary hover:underline">{journey.action}<ArrowRight className="ml-2 h-4 w-4" /></Link></div>;
              })}
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
