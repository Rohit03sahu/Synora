import Link from 'next/link';
import {
  User,
  Stethoscope,
  Building2,
  Leaf,
  ArrowRight,
  Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const solutions = [
  {
    id: 'patients',
    title: 'GenoGluco for Patients',
    tagline: 'Understand your health. Understand your risk.',
    icon: User,
    features: ['Health assessment', 'Questionnaire', 'Lab analysis', 'CGM analysis', 'Lifestyle information', 'Genomic context', 'Explainable AI', 'Personal reports'],
    cta: 'Start My Assessment',
    href: '/get-started',
  },
  {
    id: 'doctors',
    title: 'GenoGluco for Doctors',
    tagline: 'A more connected view of patient data.',
    icon: Stethoscope,
    features: ['Patient dashboard', 'Lab reports', 'CGM trends', 'Risk assessment', 'Explainable AI', 'Patient reports', 'Data timeline'],
    cta: 'Explore Clinical Platform',
    href: '/app/doctor',
  },
  {
    id: 'hospitals',
    title: 'GenoGluco for Hospitals',
    tagline: 'Population-level metabolic intelligence.',
    icon: Building2,
    features: ['Patient management', 'Doctor management', 'Risk stratification', 'Analytics', 'Data integration', 'Role-based access', 'Population trends'],
    cta: 'Explore Hospital Solution',
    href: '/app/hospital',
  },
  {
    id: 'wellness',
    title: 'GenoGluco for Wellness',
    tagline: 'From wellness tracking to preventive intelligence.',
    icon: Leaf,
    features: ['Member onboarding', 'Health surveys', 'Risk screening', 'Wellness analytics', 'Personalized insights', 'Aggregated population insights'],
    cta: 'Explore Wellness Platform',
    href: '/app/wellness',
  },
];

export function SolutionsSection() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {solutions.map((solution) => {
        const Icon = solution.icon;
        return (
          <Card key={solution.id} className="group flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-primary/30">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 text-primary transition-transform group-hover:scale-110">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">{solution.title}</CardTitle>
                  <CardDescription className="text-sm font-medium">{solution.tagline}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="grid grid-cols-2 gap-2">
                {solution.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-success flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full group-hover:border-primary group-hover:text-primary" asChild>
                <Link href={solution.href}>
                  {solution.cta}
                  <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
