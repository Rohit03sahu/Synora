import Link from 'next/link';
import { ArrowRight, Mail, Stethoscope, Building2 } from 'lucide-react';
import { Header } from '@/components/shared/header';
import { Footer } from '@/components/shared/footer';

export default function ContactPage() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="border-b border-border/60 bg-gradient-mesh">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <p className="eyebrow">Contact &amp; access</p>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">Find the right next step.</h1>
            <p className="mt-4 max-w-2xl text-muted-foreground">Patient assessments are self-serve. Clinical and organization access is arranged through an administrator.</p>
          </div>
        </section>
        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-2 lg:px-8">
          <div id="clinical-access" className="scroll-mt-20 border-t-2 border-primary pt-5">
            <Stethoscope className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-semibold">Clinician access</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Ask your healthcare organization administrator to provision clinical access. If you already have an account, sign in here.</p>
            <Link href="/sign-in" className="mt-5 inline-flex items-center text-sm font-semibold text-primary hover:underline">Clinician sign-in <ArrowRight className="ml-2 h-4 w-4" /></Link>
            <p className="mt-3 text-sm text-muted-foreground">New to GenoGluco?</p>
            <Link href="/doctor-sign-up" className="mt-1 inline-flex items-center text-sm font-semibold text-primary hover:underline">Register as a clinician <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </div>
          <div id="demo" className="scroll-mt-20 border-t-2 border-accent pt-5">
            <Building2 className="h-5 w-5 text-accent" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-semibold">Hospital and wellness demos</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Demo requests are handled by the Synora team. Contact details are shown here when configured for this deployment.</p>
            {supportEmail ? (
              <a href={`mailto:${supportEmail}?subject=GenoGluco%20demo%20request`} className="mt-5 inline-flex items-center text-sm font-semibold text-primary hover:underline"><Mail className="mr-2 h-4 w-4" />Request a demo</a>
            ) : (
              <p className="mt-5 text-sm font-medium text-muted-foreground">A public demo contact is not configured. Please contact your Synora representative.</p>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
