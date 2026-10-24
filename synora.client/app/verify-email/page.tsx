'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { AuthLayout } from '@/components/shared/auth-layout';
import { Button } from '@/components/ui/button';
import { apiPublicSend, apiPublicWrite } from '@/lib/api-client';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const requestedAccountType = searchParams.get('accountType') === 'doctor' ? 'doctor' : 'patient';
  const deliveryFailed = searchParams.get('delivery') === 'failed';
  const checkedToken = useRef<string | null>(null);
  const [status, setStatus] = useState<'checking' | 'waiting' | 'verified' | 'failed'>('checking');
  const [accountType, setAccountType] = useState<'patient' | 'doctor'>(requestedAccountType);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus(email ? 'waiting' : 'failed');
      return;
    }
    if (checkedToken.current === token) return;
    checkedToken.current = token;

    apiPublicSend<{ accountType: 'patient' | 'doctor' }>('/auth/verify-email', { token })
      .then((result) => {
        setAccountType(result.accountType);
        setStatus('verified');
      })
      .catch(() => setStatus('failed'));
  }, [token, email]);

  const resend = async () => {
    if (!email) return;
    setResending(true);
    try {
      await apiPublicWrite('/auth/resend-verification', { email });
      toast.success('If your account needs verification, a new email has been sent.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not resend the verification email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout
      title={status === 'verified' ? 'Email verified' : 'Verify your email'}
      subtitle={
        status === 'verified'
          ? 'Your Synora account is ready.'
          : status === 'waiting'
            ? deliveryFailed
              ? 'Your account was created, but the first confirmation email could not be delivered. You can request another email below.'
              : `Check your inbox for a confirmation link sent to ${email}.`
            : 'Confirm your email address to activate your account.'
      }
    >
      <div className="space-y-4">
        {status === 'checking' && <p role="status" className="text-sm text-muted-foreground">Checking your verification link...</p>}
        {status === 'failed' && <p role="alert" className="text-sm text-destructive">This email verification link is invalid or expired.</p>}
        {status === 'waiting' && email && (
          <Button type="button" variant="outline" className="w-full" onClick={resend} disabled={resending}>
            {resending ? 'Sending...' : 'Resend verification email'}
          </Button>
        )}
        {status === 'verified' && <p className="text-sm text-success">You can now sign in with your email and password.</p>}
        <Button asChild className="w-full">
          <Link href={accountType === 'doctor' ? '/doctor-sign-in' : '/sign-in'}>
            Continue to sign in
          </Link>
        </Button>
      </div>
    </AuthLayout>
  );
}
