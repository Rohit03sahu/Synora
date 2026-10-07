import { Header } from '@/components/shared/header';
import { Footer } from '@/components/shared/footer';
import { MedicalDisclaimer } from '@/components/shared/medical-disclaimer';
import { DiabetesTypes } from '@/components/diabetes/diabetes-types';
import { RiskFactorVisualization } from '@/components/diabetes/risk-factors';

export default function DiabetesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-mesh border-b border-border/60">
          <div className="absolute inset-0 bg-dot-pattern opacity-30" />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
                Understanding Diabetes
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Learn about the types of diabetes, the factors that contribute to risk, and why
                early awareness matters.
              </p>
            </div>
          </div>
        </section>

        {/* What Is Diabetes */}
        <section className="py-16 lg:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-3xl font-bold tracking-tight">What Is Diabetes?</h2>
            <div className="mt-6 space-y-4 text-base text-muted-foreground leading-relaxed">
              <p>
                Diabetes is a chronic condition that affects how the body processes glucose, the
                main type of sugar in the blood. When you eat, the body breaks food down into
                glucose, which enters the bloodstream. A hormone called insulin, produced by the
                pancreas, helps move glucose from the blood into cells where it is used for energy.
              </p>
              <p>
                In diabetes, this process is disrupted. Either the body does not produce enough
                insulin, or it cannot use insulin effectively. As a result, glucose builds up in
                the blood instead of reaching the cells, leading to high blood sugar levels.
              </p>
              <p>
                Over time, persistently high blood sugar can affect the heart, blood vessels, eyes,
                kidneys, and nerves. Understanding diabetes and its risk factors early can help
                individuals and healthcare professionals take appropriate steps toward better
                metabolic health.
              </p>
            </div>
          </div>
        </section>

        {/* Types of Diabetes */}
        <section className="border-t border-border/60 bg-muted/20 py-16 lg:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="font-display text-3xl font-bold tracking-tight">Types of Diabetes</h2>
              <p className="mt-3 text-muted-foreground">
                Click on each type to learn more about its characteristics
              </p>
            </div>
            <div className="mt-10">
              <DiabetesTypes />
            </div>
          </div>
        </section>

        {/* Risk Factors */}
        <section className="border-t border-border/60 py-16 lg:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="font-display text-3xl font-bold tracking-tight">Diabetes Risk Factors</h2>
              <p className="mt-3 text-muted-foreground">
                Explore the different categories of factors that contribute to diabetes risk
              </p>
            </div>
            <div className="mt-10">
              <RiskFactorVisualization />
            </div>
          </div>
        </section>

        {/* Disclaimer */}
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
