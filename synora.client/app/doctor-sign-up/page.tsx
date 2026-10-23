'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Phone, Lock, UserRound, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase-client';
import { AuthLayout } from '@/components/shared/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export default function DoctorSignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [consented, setConsented] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailVerificationRequired, setEmailVerificationRequired] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(), password,
      options: { data: { full_name: fullName.trim(), phone: phone.trim(), role: 'doctor' } },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    if (!data.session) { setEmailVerificationRequired(true); return; }
    router.push('/doctor-onboarding');
  };

  if (emailVerificationRequired) return <AuthLayout title="Verify your email" subtitle="Use the confirmation link sent by your sign-in provider, then return to complete your professional profile."><div className="space-y-4"><p className="text-sm text-muted-foreground">We sent an email verification message to {email}. Your account will remain a patient account until a platform administrator approves your professional credentials.</p><Button className="w-full" onClick={() => router.push('/sign-in?next=doctor-onboarding')}>Continue to sign in</Button></div></AuthLayout>;

  return <AuthLayout title="Clinician registration" subtitle="Create an account, verify your contact details, and submit professional credentials for review." footer={<p className="text-center text-sm text-muted-foreground">Already registered? <Link href="/sign-in?next=doctor-onboarding" className="font-medium text-primary hover:underline">Sign in</Link></p>}>
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2"><Label htmlFor="doctor-name">Full name</Label><div className="relative"><UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="doctor-name" className="pl-10" autoComplete="name" required maxLength={200} value={fullName} onChange={(event) => setFullName(event.target.value)} /></div></div>
      <div className="space-y-2"><Label htmlFor="doctor-email">Professional email</Label><div className="relative"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="doctor-email" type="email" autoComplete="email" className="pl-10" required value={email} onChange={(event) => setEmail(event.target.value)} /></div><p className="text-xs text-muted-foreground">Email verification is provided by your configured Supabase Auth settings.</p></div>
      <div className="space-y-2"><Label htmlFor="doctor-phone">Mobile number</Label><div className="relative"><Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="doctor-phone" type="tel" autoComplete="tel" className="pl-10" required placeholder="Include country code" value={phone} onChange={(event) => setPhone(event.target.value)} /></div><p className="text-xs text-muted-foreground">An SMS one-time code will be requested during profile setup. SMS delivery depends on your Supabase phone provider configuration.</p></div>
      <div className="space-y-2"><Label htmlFor="doctor-password">Password</Label><div className="relative"><Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="doctor-password" type="password" autoComplete="new-password" className="pl-10" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></div><p className="text-xs text-muted-foreground">Use at least 8 characters.</p></div>
      <label className="flex cursor-pointer items-start gap-3"><Checkbox checked={consented} onCheckedChange={(value) => setConsented(value === true)} /><span className="text-xs leading-relaxed text-muted-foreground">I agree to the <Link href="/terms" className="text-primary underline">Terms</Link> and acknowledge the <Link href="/privacy" className="text-primary underline">Privacy Policy</Link>.</span></label>
      <Button type="submit" className="w-full" disabled={loading || !consented}>{loading ? 'Creating account...' : 'Continue to professional profile'}<ArrowRight className="ml-2 h-4 w-4" /></Button>
    </form>
  </AuthLayout>;
}
