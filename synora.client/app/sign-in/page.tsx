import { redirect } from 'next/navigation';
import { SignInForm } from '@/components/shared/sign-in-form';

interface SignInPageProps {
  searchParams: {
    next?: string;
  };
}

export default function SignInPage({ searchParams }: SignInPageProps) {
  if (searchParams.next === 'doctor-onboarding') {
    redirect('/doctor-sign-in');
  }

  return <SignInForm accountType="patient" />;
}
