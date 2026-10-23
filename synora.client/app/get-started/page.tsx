'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Stethoscope, Building2, Leaf, ArrowRight, Check, Sparkles } from 'lucide-react';
import { SynoraHealthLogo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { enabledFeatures } from '@/lib/features';

const roles = [
  { id: 'patient', label: 'Patient', icon: User, desc: 'Start an assessment with the health information you already have.' },
  { id: 'doctor', label: 'Doctor / Clinician', icon: Stethoscope, desc: 'Clinical access is arranged through your organization.' },
  { id: 'hospital', label: 'Hospital', icon: Building2, desc: 'Organization access is provisioned by an administrator.' },
  { id: 'wellness', label: 'Wellness Organization', icon: Leaf, desc: 'Organization access is provisioned by an administrator.' },
];

export default function GetStartedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<string | null>(null);
  const availableRoles = roles.filter((role) =>
    role.id === 'hospital'
      ? enabledFeatures.hospitals
      : role.id === 'wellness'
        ? enabledFeatures.wellness
        : true,
  );

  useEffect(() => {
    const requestedRole = searchParams.get('role');
    if (availableRoles.some((role) => role.id === requestedRole)) setSelected(requestedRole);
  }, [searchParams]);

  const handleContinue = () => {
    if (!selected) return;
    if (selected === 'patient') router.push('/sign-up?role=patient');
    else if (selected === 'doctor') router.push('/doctor-sign-up');
    else router.push(`/solutions#${selected === 'hospital' ? 'hospitals' : 'wellness'}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-mesh">
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      <div className="relative flex flex-col min-h-screen">
        <header className="border-b border-border/60 bg-background/80 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
            <Link href="/"><SynoraHealthLogo /></Link>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-2xl space-y-8">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Welcome to GenoGluco
              </div>
              <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Let&rsquo;s build your health profile.
              </h1>
              <p className="text-muted-foreground">Choose the path that fits you.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {availableRoles.map((role) => {
                const Icon = role.icon;
                const isSelected = selected === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => setSelected(role.id)}
                    className={cn(
                      'group relative flex items-center gap-4 rounded-xl border-2 p-5 text-left transition-all',
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                        : 'border-border bg-card hover:border-primary/30 hover:shadow-md'
                    )}
                  >
                    <div className={cn(
                      'flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl transition-all',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-primary/10 text-primary group-hover:bg-primary/15'
                    )}>
                      <Icon className="h-7 w-7" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold">{role.label}</h3>
                      <p className="text-sm text-muted-foreground">{role.desc}</p>
                    </div>
                    {isSelected && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-center">
              <Button size="lg" disabled={!selected} onClick={handleContinue} className="min-w-[200px]">
                {selected === 'patient' ? 'Start assessment' : selected === 'doctor' ? 'Clinician sign-in' : selected ? 'Explore organization access' : 'Choose a path'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
