'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  User,
  FlaskConical,
  Activity,
  Dna,
  Watch,
  Brain,
  FileText,
  Settings,
  Shield,
  LogOut,
  Menu,
  X,
  ChevronLeft,
} from 'lucide-react';
import { GenoGlucoLogo } from '@/components/shared/logo';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

const patientNav = [
  { label: 'Dashboard', href: '/app/patient', icon: LayoutDashboard },
  { label: 'Profile', href: '/app/patient/profile', icon: User },
  { label: 'Lab Reports', href: '/app/patient/lab-upload', icon: FlaskConical },
  { label: 'CGM Dashboard', href: '/app/patient/cgm', icon: Activity },
  { label: 'Genomics', href: '/app/patient/genomics', icon: Dna },
  { label: 'Insulin & Devices', href: '/app/patient/insulin', icon: Watch },
  { label: 'AI Assessment', href: '/app/patient/assessment', icon: Brain },
  { label: 'Reports', href: '/app/patient/reports', icon: FileText },
  { label: 'Settings', href: '/app/patient/settings', icon: Settings },
  { label: 'Privacy & Consent', href: '/app/patient/privacy', icon: Shield },
];

const doctorNav = [
  { label: 'Dashboard', href: '/app/doctor', icon: LayoutDashboard },
  { label: 'Patients', href: '/app/doctor/patients', icon: User },
  { label: 'AI Insights', href: '/app/doctor/insights', icon: Brain },
  { label: 'Reports', href: '/app/doctor/reports', icon: FileText },
  { label: 'Settings', href: '/app/doctor/settings', icon: Settings },
];

const hospitalNav = [
  { label: 'Dashboard', href: '/app/hospital', icon: LayoutDashboard },
  { label: 'Patients', href: '/app/hospital/patients', icon: User },
  { label: 'Analytics', href: '/app/hospital/analytics', icon: Activity },
  { label: 'Settings', href: '/app/hospital/settings', icon: Settings },
];

const wellnessNav = [
  { label: 'Dashboard', href: '/app/wellness', icon: LayoutDashboard },
  { label: 'Members', href: '/app/wellness/members', icon: User },
  { label: 'Insights', href: '/app/wellness/insights', icon: Brain },
  { label: 'Settings', href: '/app/wellness/settings', icon: Settings },
];

function getNavForPath(pathname: string) {
  if (pathname.startsWith('/app/patient')) return patientNav;
  if (pathname.startsWith('/app/doctor')) return doctorNav;
  if (pathname.startsWith('/app/hospital')) return hospitalNav;
  if (pathname.startsWith('/app/wellness')) return wellnessNav;
  return patientNav;
}

function getRoleLabel(pathname: string) {
  if (pathname.startsWith('/app/patient')) return 'Patient';
  if (pathname.startsWith('/app/doctor')) return 'Clinical';
  if (pathname.startsWith('/app/hospital')) return 'Enterprise';
  if (pathname.startsWith('/app/wellness')) return 'Wellness';
  return 'Patient';
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, profile } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = getNavForPath(pathname);
  const roleLabel = getRoleLabel(pathname);

  const handleSignOut = async () => {
    await signOut();
    router.push('/sign-in');
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border/60 p-4">
        <Link href="/">
          <GenoGlucoLogo size="sm" />
        </Link>
        <button className="lg:hidden" onClick={() => setMobileOpen(false)}>
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-4 py-3">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          GenoGluco {roleLabel}
        </span>
        {profile && (
          <p className="text-xs text-muted-foreground mt-1 truncate">{profile.email}</p>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/60 p-3 space-y-1">
        <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" />
          Back to Home
        </Link>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile header */}
      <div className="flex items-center justify-between border-b border-border/60 bg-background px-4 py-3 lg:hidden">
        <Link href="/"><GenoGlucoLogo size="sm" /></Link>
        <button onClick={() => setMobileOpen(true)}>
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-background shadow-xl">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-border/60 bg-card lg:block">
        <div className="sticky top-0 h-screen">
          {sidebarContent}
        </div>
      </aside>
    </>
  );
}
