'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { AuthLayout } from '@/components/shared/auth-layout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiGet } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

interface SignInFormProps {
  accountType: 'patient' | 'doctor';
}

export function SignInForm({ accountType }: SignInFormProps) {
  const router = useRouter();
  const { signIn, signOut } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const isDoctor = accountType === 'doctor';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password, accountType);
    if (error) {
      toast.error(error);
      setLoading(false);
      return;
    }

    try {
      const profile = await apiGet<{ accountType: 'patient' | 'doctor'; role: string }>('/me');
      if (profile.accountType !== accountType) {
        await signOut();
        toast.error(`This account uses ${profile.accountType === 'doctor' ? 'clinician' : 'patient'} sign-in.`);
        setLoading(false);
        return;
      }

      toast.success('Welcome back!');
      if (isDoctor) {
        router.push(profile.role === 'doctor' ? '/app/doctor' : '/doctor-onboarding');
      } else {
        router.push(profile.role === 'platform_admin' ? '/app/admin/doctors' : `/app/${profile.role}`);
      }
    } catch (cause) {
      await signOut();
      toast.error(cause instanceof Error ? cause.message : 'Could not load your account profile.');
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={isDoctor ? 'Clinician sign in' : 'Patient sign in'}
      subtitle={
        isDoctor
          ? 'Access your clinician application, consultation requests, and patient conversations.'
          : 'Access your health profile, records, and connected care team.'
      }
      footer={
        <div className="space-y-2 text-center text-sm text-muted-foreground">
          {isDoctor ? (
            <>
              <p>
                New clinician?{' '}
                <Link href="/doctor-sign-up" className="font-medium text-primary hover:underline">
                  Create a clinician account
                </Link>
              </p>
              <p>
                Patient instead?{' '}
                <Link href="/sign-in" className="font-medium text-primary hover:underline">
                  Patient sign in
                </Link>
              </p>
            </>
          ) : (
            <>
              <p>
                New patient?{' '}
                <Link href="/sign-up" className="font-medium text-primary hover:underline">
                  Create an account
                </Link>
              </p>
              <p>
                Clinician instead?{' '}
                <Link href="/doctor-sign-in" className="font-medium text-primary hover:underline">
                  Clinician sign in
                </Link>
              </p>
            </>
          )}
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="pl-10"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
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
              autoComplete="current-password"
              placeholder="Enter your password"
              className="pl-10 pr-10"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
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
          {loading ? 'Signing in...' : `Sign in as ${isDoctor ? 'clinician' : 'patient'}`}
          {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </form>
    </AuthLayout>
  );
}
