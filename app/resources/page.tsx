import { Header } from '@/components/shared/header';
import { Footer } from '@/components/shared/footer';
import { MedicalDisclaimer } from '@/components/shared/medical-disclaimer';
import { FileText, BookOpen, FlaskConical, Shield, Activity, Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const resources = [
  { title: 'Understanding HbA1c', desc: 'What HbA1c means and why it matters for diabetes assessment.', icon: FlaskConical, category: 'Clinical' },
  { title: 'CGM Basics', desc: 'How continuous glucose monitoring works and what it reveals.', icon: Activity, category: 'Technology' },
  { title: 'Genetic Risk Factors', desc: 'Understanding how genetics contributes to diabetes risk.', icon: Brain, category: 'Genomics' },
  { title: 'Lifestyle & Metabolic Health', desc: 'The role of diet, exercise, and sleep in diabetes prevention.', icon: BookOpen, category: 'Lifestyle' },
  { title: 'Data Privacy Guide', desc: 'How GenoGluco protects and manages your health data.', icon: Shield, category: 'Privacy' },
  { title: 'Explainable AI', desc: 'What explainable AI means and why it matters for health insights.', icon: FileText, category: 'AI' },
];

export default function ResourcesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-mesh border-b border-border/60">
          <div className="absolute inset-0 bg-dot-pattern opacity-30" />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
                Resources
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Learn more about diabetes, metabolic health, and the technology behind GenoGluco.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {resources.map((res) => {
                const Icon = res.icon;
                return (
                  <Card key={res.title} className="transition-all hover:shadow-lg hover:border-primary/30 cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground rounded-full border border-border px-2 py-0.5">
                          {res.category}
                        </span>
                      </div>
                      <CardTitle className="text-base mt-3">{res.title}</CardTitle>
                      <CardDescription className="text-sm">{res.desc}</CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
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
