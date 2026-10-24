'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { AuthLayout } from '@/components/shared/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiPublicWrite } from '@/lib/api-client';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [updated, setUpdated] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) {
      toast.error('This password reset link is invalid or expired.');
      return;
    }
    if (password.length < 8 || password.length > 128) {
      toast.error('Use a password between 8 and 128 characters.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('The passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await apiPublicWrite('/auth/password-reset/confirm', { token, newPassword: password });
      setUpdated(true);
      toast.success('Password updated.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not reset your password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle={updated ? 'Your new password is ready to use.' : 'Choose a new password for your Synora account.'}
    >
      {updated ? (
        <Button asChild className="w-full">
          <Link href="/sign-in">Continue to sign in</Link>
        </Button>
      ) : !token ? (
        <div className="space-y-4">
          <p role="alert" className="text-sm text-destructive">This password reset link is invalid or expired.</p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/forgot-password">Request another reset link</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Updating...' : 'Set new password'}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
