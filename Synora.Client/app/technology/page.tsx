import { Header } from '@/components/shared/header';
import { Footer } from '@/components/shared/footer';
import { MedicalDisclaimer } from '@/components/shared/medical-disclaimer';
import {
  Activity,
  Watch,
  Dna,
  FlaskConical,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const techCards = [
  {
    id: 'cgm',
    title: 'Continuous Glucose Monitoring',
    short: 'CGM',
    icon: Activity,
    flow: ['CGM Sensor', 'Continuous Glucose Data', 'Time-Series Analysis', 'Pattern Detection', 'GenoGluco Insights'],
    description: 'Continuous glucose monitoring provides real-time glucose readings throughout the day and night, enabling detailed analysis of glucose patterns, trends, and responses.',
    features: ['Real-time glucose readings', 'Trend analysis', 'Pattern detection', 'Alert capabilities'],
  },
  {
    id: 'insulin',
    title: 'Insulin Pump',
    short: 'Insulin & Devices',
    icon: Watch,
    flow: ['Insulin Pump Data', 'Delivery Patterns', 'Context Analysis', 'GenoGluco Integration'],
    description: 'Insulin pump data provides context about basal rates, bolus delivery, and correction doses, offering a richer picture of diabetes management.',
    features: [
      { label: 'Basal insulin', desc: 'Background insulin delivery rates' },
      { label: 'Bolus insulin', desc: 'Meal-time insulin doses' },
      { label: 'Correction doses', desc: 'Adjustments for high glucose' },
      { label: 'Carbohydrate inputs', desc: 'Logged carb intake data' },
      { label: 'Insulin delivery patterns', desc: 'Overall delivery trends over time' },
    ],
  },
  {
    id: 'genomics',
    title: 'Genomics',
    short: 'Genomics',
    icon: Dna,
    flow: ['Genetic Data', 'Variant Analysis', 'Risk Scoring', 'Contextual Interpretation'],
    description: 'Genomic information includes genetic variants, SNPs, and polygenic risk scores that can contribute to understanding inherited risk factors.',
    features: ['SNPs', 'Genetic variants', 'Family history', 'Polygenic risk information'],
    note: 'Genetic information can contribute to risk assessment but does not independently determine whether someone will develop diabetes. It should always be interpreted with clinical context.',
  },
  {
    id: 'lab',
    title: 'Laboratory Data',
    short: 'Laboratory',
    icon: FlaskConical,
    flow: ['Lab Report', 'OCR / Extraction', 'Parameter Identification', 'Validation', 'GenoGluco Analysis'],
    description: 'Laboratory results provide essential clinical biomarkers for diabetes and metabolic health assessment.',
    features: ['HbA1c', 'Fasting glucose', 'Post-meal glucose', 'Lipid profile', 'Kidney markers', 'Other relevant biomarkers'],
  },
];

export default function TechnologyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-mesh border-b border-border/60">
          <div className="absolute inset-0 bg-dot-pattern opacity-30" />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
                The Technologies Behind GenoGluco
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                From continuous glucose monitoring to genomics, GenoGluco integrates multiple health
                data technologies through Synora Intelligence&trade;.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-8">
            {techCards.map((card, idx) => {
              const Icon = card.icon;
              const isReversed = idx % 2 === 1;
              return (
                <div key={card.id} id={card.id}>
                  <Card className="overflow-hidden">
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 text-primary">
                          <Icon className="h-7 w-7" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{card.title}</CardTitle>
                          <CardDescription className="text-sm">{card.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Flow diagram */}
                      <div className="flex flex-wrap items-center gap-2">
                        {card.flow.map((step, i, arr) => (
                          <div key={step} className="flex items-center gap-2">
                            <span className="rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium">
                              {step}
                            </span>
                            {i < arr.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-primary" />}
                          </div>
                        ))}
                      </div>

                      {/* Features */}
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                          Key Parameters
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {(Array.isArray(card.features[0]) ? card.features : card.features).map((feat: any) => {
                            const label = typeof feat === 'string' ? feat : feat.label;
                            return (
                              <span key={label} className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium">
                                {label}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Note for genomics */}
                      {card.note && (
                        <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
                          <p className="text-xs text-muted-foreground leading-relaxed">{card.note}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
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
