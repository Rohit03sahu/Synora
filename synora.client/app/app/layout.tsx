'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/app/app-sidebar';
import { useAuth } from '@/lib/auth-context';
import { enabledFeatures } from '@/lib/features';
import { Loader2 } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const featureDisabled =
    (pathname.startsWith('/app/hospital') && !enabledFeatures.hospitals) ||
    (pathname.startsWith('/app/wellness') && !enabledFeatures.wellness);

  useEffect(() => {
    if (!loading && !session) {
      router.push('/sign-in');
    } else if (!loading && session && featureDisabled) {
      router.replace('/app/patient');
    }
  }, [loading, session, featureDisabled, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session || featureDisabled) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[radial-gradient(ellipse_at_top_left,hsl(var(--primary)/0.035),transparent_32rem)]">
      <AppSidebar />
    <div className="min-w-0 flex-1">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          {children}
        </div>
      </div>
    </div>
  );
}
