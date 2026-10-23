'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight, Stethoscope, Building2, Leaf } from 'lucide-react';
import { toast } from 'sonner';
import { AuthLayout } from '@/components/shared/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth-context';
import { enabledFeatures } from '@/lib/features';
import type { UserRole } from '@/lib/types';

const roleMeta: Record<UserRole, { label: string; icon: typeof User }> = {
  patient: { label: 'Patient', icon: User },
  doctor: { label: 'Doctor / Clinician', icon: Stethoscope },
  hospital: { label: 'Hospital', icon: Building2 },
  wellness: { label: 'Wellness Organization', icon: Leaf },
};

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState('');
  const [consents, setConsents] = useState({ terms: false, privacy: false, health: false });
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const availableRoles = (Object.keys(roleMeta) as UserRole[]).filter((role) =>
    role === 'hospital' ? enabledFeatures.hospitals : role === 'wellness' ? enabledFeatures.wellness : true,
  );

  useEffect(() => {
    const preselected = searchParams.get('role');
    if (preselected && availableRoles.includes(preselected as UserRole)) {
      setUserType(preselected);
    }
  }, [searchParams]);

  const allConsents = consents.terms && consents.privacy && consents.health;
  const passwordsMatch = password === confirm && password.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allConsents || !userType || !passwordsMatch) return;
    setLoading(true);
    const { error } = await signUp(email, password, name, mobile, userType as UserRole);
    if (error) {
      toast.error(error);
      setLoading(false);
      return;
    }
    toast.success('Account created successfully!');
    if (userType === 'patient') {
      router.push('/onboarding');
    } else {
      router.push(`/app/${userType}`);
    }
  };

  return (
    <AuthLayout
      title="Create Your GenoGluco Account"
      subtitle="Join the platform connecting health signals for better diabetes risk understanding"
      footer={
        <p className="text-sm text-muted-foreground text-center">
          Already have an account?{' '}
          <Link href="/sign-in" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="name"
              placeholder="John Doe"
              className="pl-10"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

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
          <Label htmlFor="mobile">Mobile</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="mobile"
              type="tel"
              placeholder="+1 (555) 000-0000"
              className="pl-10"
              required
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 6 chars"
                className="pl-10 pr-10"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirm"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Confirm"
                className="pl-10 pr-10"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {password && confirm && !passwordsMatch && (
          <p className="text-xs text-destructive">Passwords do not match (minimum 6 characters)</p>
        )}

        <div className="space-y-2">
          <Label>Account Type</Label>
          <Select value={userType} onValueChange={setUserType}>
            <SelectTrigger>
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent>
              {availableRoles.map((role) => (
                <SelectItem key={role} value={role}>{roleMeta[role].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3 rounded-lg border border-border p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox checked={consents.terms} onCheckedChange={(v) => setConsents({ ...consents, terms: !!v })} />
            <span className="text-xs text-muted-foreground leading-relaxed">I agree to the Terms of Service</span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox checked={consents.privacy} onCheckedChange={(v) => setConsents({ ...consents, privacy: !!v })} />
            <span className="text-xs text-muted-foreground leading-relaxed">I acknowledge the Privacy Policy</span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox checked={consents.health} onCheckedChange={(v) => setConsents({ ...consents, health: !!v })} />
            <span className="text-xs text-muted-foreground leading-relaxed">
              I consent to the collection and processing of health information for the selected
              platform purpose
            </span>
          </label>
        </div>

        <Button type="submit" className="w-full" disabled={loading || !allConsents || !userType || !passwordsMatch}>
          {loading ? 'Creating account...' : 'Create GenoGluco Account'}
          {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </form>
    </AuthLayout>
  );
}
