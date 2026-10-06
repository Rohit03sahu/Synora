import { Header } from '@/components/shared/header';
import { Footer } from '@/components/shared/footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 space-y-8">
          <h1 className="font-display text-3xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Last updated: October 2026</p>
          <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
            <section><h2 className="text-lg font-semibold text-foreground mb-2">1. Acceptance</h2><p>By accessing or using GenoGluco, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.</p></section>
            <section><h2 className="text-lg font-semibold text-foreground mb-2">2. Service Description</h2><p>GenoGluco is an AI-powered health information platform that provides diabetes risk assessment insights based on available data. It is not a medical device and does not provide medical diagnosis, treatment, or advice.</p></section>
            <section><h2 className="text-lg font-semibold text-foreground mb-2">3. Not Medical Advice</h2><p>All AI-generated results are informational only and are not a substitute for professional medical diagnosis, treatment, or advice. Always consult a qualified healthcare professional for medical decisions.</p></section>
            <section><h2 className="text-lg font-semibold text-foreground mb-2">4. User Responsibilities</h2><p>You are responsible for providing accurate information, maintaining the confidentiality of your account, and all activities under your account.</p></section>
            <section><h2 className="text-lg font-semibold text-foreground mb-2">5. Data Consent</h2><p>You must provide explicit consent for the collection and processing of health information. You may withdraw consent at any time, which may affect the platform&rsquo;s ability to provide assessments.</p></section>
            <section><h2 className="text-lg font-semibold text-foreground mb-2">6. Limitation of Liability</h2><p>Synora Health is not liable for any medical decisions made based on GenoGluco insights. The platform is provided &ldquo;as is&rdquo; without warranties of any kind.</p></section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
