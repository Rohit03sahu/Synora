import { Header } from '@/components/shared/header';
import { Footer } from '@/components/shared/footer';
import { MedicalDisclaimer } from '@/components/shared/medical-disclaimer';
import { AlertCircle } from 'lucide-react';

export default function MedicalDisclaimerPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 space-y-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10 text-warning">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Medical Disclaimer</h1>
          </div>
          <MedicalDisclaimer />
          <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
            <section><h2 className="text-lg font-semibold text-foreground mb-2">No Medical Diagnosis</h2><p>GenoGluco provides health information and risk-assessment insights based on available data. The platform uses AI/ML models to analyze health data and generate assessments. These assessments are not medical diagnoses.</p></section>
            <section><h2 className="text-lg font-semibold text-foreground mb-2">Not a Substitute for Professional Care</h2><p>AI-generated results are not a substitute for professional medical diagnosis, treatment, or advice. Users should consult an appropriately qualified healthcare professional for medical decisions.</p></section>
            <section><h2 className="text-lg font-semibold text-foreground mb-2">Data Limitations</h2><p>Assessments are based on the data available at the time of analysis. Incomplete or inaccurate data may affect the quality and accuracy of insights. Data quality indicators are provided with each assessment.</p></section>
            <section><h2 className="text-lg font-semibold text-foreground mb-2">Genetic Information</h2><p>Genetic information can contribute to risk assessment but does not independently determine whether someone will develop diabetes. Genomic data should always be interpreted with clinical context.</p></section>
            <section><h2 className="text-lg font-semibold text-foreground mb-2">Emergency Situations</h2><p>GenoGluco is not designed for emergency medical situations. If you experience a medical emergency, contact your local emergency services immediately.</p></section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
