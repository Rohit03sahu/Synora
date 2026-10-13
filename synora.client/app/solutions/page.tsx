import { Header } from '@/components/shared/header';
import { Footer } from '@/components/shared/footer';
import { MedicalDisclaimer } from '@/components/shared/medical-disclaimer';
import { SolutionsSection } from '@/components/home/solutions-section';

export default function SolutionsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-mesh border-b border-border/60">
          <div className="absolute inset-0 bg-dot-pattern opacity-30" />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
                GenoGluco Solutions
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Tailored experiences for patients, doctors, hospitals, and wellness organizations.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SolutionsSection />
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
