'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, ArrowRight, UserRound, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';
import { AuthLayout } from '@/components/shared/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/lib/auth-context';
import { apiGet } from '@/lib/api-client';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const [loginRole, setLoginRole] = useState<'patient' | 'doctor'>(
    searchParams.get('next') === 'doctor-onboarding' ? 'doctor' : 'patient',
  );
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast.error(error);
      setLoading(false);
      return;
    }
    toast.success('Welcome back!');
    if (searchParams.get('next') === 'doctor-onboarding') {
      router.push('/doctor-onboarding');
      return;
    }
    try {
      const currentProfile = await apiGet<{ role: string }>('/me');
      if (searchParams.get('next') === 'doctor-onboarding') {
        router.push('/doctor-onboarding');
      } else if (loginRole === 'doctor' && currentProfile.role === 'patient') {
        router.push('/doctor-onboarding');
      } else if (loginRole === 'doctor' && currentProfile.role !== 'doctor') {
        toast.error('This account is not registered as a clinician. Choose Patient sign in or use a clinician account.');
        setLoading(false);
      } else if (loginRole === 'patient' && currentProfile.role === 'doctor') {
        toast.error('This is a clinician account. Opening the clinician workspace.');
        router.push('/app/doctor');
      } else {
        router.push(currentProfile.role === 'platform_admin' ? '/app/admin/doctors' : `/app/${currentProfile.role}`);
      }
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Signed in, but could not load your account profile.');
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={loginRole === 'doctor' ? 'Doctor sign in' : 'Patient sign in'}
      subtitle={loginRole === 'doctor' ? 'Access your clinician profile, consultation requests, and patient conversations.' : 'Access your health profile, records, and connected care team.'}
      footer={
        <div className="space-y-2 text-center text-sm text-muted-foreground">
          {loginRole === 'doctor' ? <p>New clinician? <Link href="/doctor-sign-up" className="font-medium text-primary hover:underline">Register for verification</Link></p> : <p>New patient? <Link href="/sign-up" className="font-medium text-primary hover:underline">Create an account</Link></p>}
          {loginRole === 'doctor' && <p>Patient instead? <button type="button" onClick={() => setLoginRole('patient')} className="font-medium text-primary hover:underline">Patient sign in</button></p>}
          {loginRole === 'patient' && <p>Clinician instead? <button type="button" onClick={() => setLoginRole('doctor')} className="font-medium text-primary hover:underline">Doctor sign in</button></p>}
        </div>
      }
    >
      <div className="grid grid-cols-2 rounded-lg border border-border p-1" role="tablist" aria-label="Sign-in role">
        <button type="button" role="tab" aria-selected={loginRole === 'patient'} onClick={() => setLoginRole('patient')} className={`flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium ${loginRole === 'patient' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}><UserRound className="h-4 w-4" />Patient</button>
        <button type="button" role="tab" aria-selected={loginRole === 'doctor'} onClick={() => setLoginRole('doctor')} className={`flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium ${loginRole === 'doctor' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}><Stethoscope className="h-4 w-4" />Doctor</button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="pl-10"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              className="pl-10 pr-10"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox id="remember" />
          <Label htmlFor="remember" className="text-sm font-normal">Remember me</Label>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
          {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </form>
    </AuthLayout>
  );
}
