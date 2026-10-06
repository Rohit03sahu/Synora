import { Header } from '@/components/shared/header';
import { Footer } from '@/components/shared/footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 space-y-8">
          <h1 className="font-display text-3xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: October 2026</p>
          <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
            <section><h2 className="text-lg font-semibold text-foreground mb-2">1. Overview</h2><p>Synora Health (&ldquo;we&rdquo;) operates the GenoGluco platform, which collects, processes, and analyzes health data to provide diabetes risk assessment insights. We are committed to protecting your privacy and giving you control over your data.</p></section>
            <section><h2 className="text-lg font-semibold text-foreground mb-2">2. Data We Collect</h2><p>GenoGluco may collect: personal information (name, email, mobile), health information (lab results, CGM data, genomic data, lifestyle information), and device data from connected health devices. All data collection requires your explicit consent.</p></section>
            <section><h2 className="text-lg font-semibold text-foreground mb-2">3. How We Use Your Data</h2><p>Your data is used to: generate personalized health risk assessments, provide explainable AI insights, improve our AI models with anonymized data (only with your consent), and provide reports for you and your authorized healthcare providers.</p></section>
            <section><h2 className="text-lg font-semibold text-foreground mb-2">4. Data Sharing</h2><p>We do not sell your data. Your health data is shared only: with healthcare providers you authorize, with wellness organizations you belong to (aggregated and anonymized only), and as required by law.</p></section>
            <section><h2 className="text-lg font-semibold text-foreground mb-2">5. Your Rights</h2><p>You have the right to: access your data, download a copy of your data, withdraw consent at any time, delete your data, and view a complete audit trail of all data access.</p></section>
            <section><h2 className="text-lg font-semibold text-foreground mb-2">6. Security</h2><p>We use industry-standard security measures including encryption, role-based access control, secure authentication, and comprehensive audit trails to protect your health data.</p></section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
