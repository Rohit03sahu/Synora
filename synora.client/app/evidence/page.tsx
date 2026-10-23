import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Header } from '@/components/shared/header';
import { Footer } from '@/components/shared/footer';
import { MedicalDisclaimer } from '@/components/shared/medical-disclaimer';

const sections = [
  {
    title: 'Who GenoGluco is for',
    body: 'People who want to organize available metabolic-health information and prepare questions for a healthcare professional. Clinician and organization access is provisioned through participating organizations.',
  },
  {
    title: 'What it is intended to support',
    body: 'Organizing self-reported health context and available glucose or laboratory information for review with a healthcare professional. Automated assessment generation is not currently connected.',
  },
  {
    title: 'Validation status',
    body: 'Clinical validation results, peer-reviewed studies, and performance metrics are not currently published on this site. Do not interpret a platform summary as evidence that a model is clinically validated.',
  },
  {
    title: 'How to interpret explanations',
    body: 'A factor shown with an assessment may describe an input or a model-generated explanation. It does not establish that the factor caused a health outcome. An association or model explanation is not a confirmed causal finding.',
  },
  {
    title: 'Known limitations',
    body: 'Information can be incomplete, out of date, self-reported, or entered with errors. Results may not represent an individual accurately and must be interpreted with clinical context. GenoGluco does not diagnose, prescribe, or recommend medication or insulin changes.',
  },
  {
    title: 'Available capabilities',
    body: 'The application currently includes account setup, health-profile onboarding, optional lab and device information flows, consent controls, and an access history view. Automated assessment generation is not currently connected. Clinical validation evidence and self-service health-data export are not published or available through this site.',
  },
];

export default function EvidencePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="border-b border-border/60 bg-gradient-mesh">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <p className="eyebrow">Evidence &amp; limitations</p>
            <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold tracking-tight">Know what GenoGluco can and cannot tell you.</h1>
            <p className="mt-4 max-w-2xl text-muted-foreground">A plain-language summary of intended use, current evidence, and important limitations.</p>
          </div>
        </section>
        <section className="mx-auto grid w-full max-w-7xl gap-x-16 gap-y-0 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,0.65fr)_minmax(0,1.35fr)] lg:px-8">
          <aside className="border-b border-border py-6 lg:border-b-0 lg:border-r lg:pr-10">
            <h2 className="font-semibold">Before you use a summary</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">GenoGluco is not a medical device or a substitute for professional medical advice. Do not use it for urgent decisions or to change treatment.</p>
            <Link href="/medical-disclaimer" className="mt-4 inline-flex items-center text-sm font-medium text-primary hover:underline">Medical disclaimer <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </aside>
          <div className="divide-y divide-border">
            {sections.map((section) => (
              <section key={section.title} className="py-6">
                <h2 className="text-lg font-semibold">{section.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
              </section>
            ))}
          </div>
        </section>
        <section className="border-t border-border/60 bg-muted/20 py-10">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8"><MedicalDisclaimer /></div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
