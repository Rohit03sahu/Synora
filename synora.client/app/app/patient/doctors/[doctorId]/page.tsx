'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Languages, MapPin, UserRound } from 'lucide-react';
import { apiGet } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Doctor = {
  id: string; fullName: string; specialty: string; qualifications: string; experienceYears: number;
  expertise: string[]; affiliation: string; languages: string[]; clinicAddress: string;
  consultationModes: string[]; consultationFee: number | null; biography: string; interests: string[];
  availability: unknown; photoUrl: string | null; registrationNumber: string; issuingCouncil: string;
  verificationStatus: 'approved'; verifiedAt: string;
};

export default function DoctorDetailsPage() {
  const params = useParams<{ doctorId: string }>();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGet<Doctor>(`/doctor/directory/${params.doctorId}`).then(setDoctor)
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Could not load this profile.'))
      .finally(() => setLoading(false));
  }, [params.doctorId]);

  if (loading) return <p role="status" className="py-12 text-center text-sm text-muted-foreground">Loading verified profile...</p>;
  if (error || !doctor) return <div className="space-y-4"><p role="alert" className="text-sm text-destructive">{error || 'Doctor profile not found.'}</p><Button variant="outline" asChild><Link href="/app/patient/doctors">Back to doctors</Link></Button></div>;

  return <div className="mx-auto max-w-4xl space-y-6">
    <Button variant="ghost" size="sm" asChild><Link href="/app/patient/doctors"><ArrowLeft className="mr-2 h-4 w-4" />Back to Find a Doctor</Link></Button>
    <Card className="rounded-lg"><CardContent className="p-6 sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row">
        <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-primary">{doctor.photoUrl ? <img src={doctor.photoUrl} alt={doctor.fullName} className="h-full w-full object-cover" /> : <UserRound className="h-10 w-10" aria-hidden="true" />}</div>
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h1 className="font-display text-2xl font-bold">{doctor.fullName}</h1><span className="rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">Verified professional</span></div><p className="mt-1 text-primary">{doctor.specialty}</p><p className="mt-2 text-sm text-muted-foreground">{doctor.qualifications} · {doctor.experienceYears} years of experience</p><p className="mt-2 text-xs text-muted-foreground">Registration checked by {doctor.issuingCouncil} · {doctor.registrationNumber}</p></div>
      </div>
      <div className="mt-7 grid gap-4 border-y border-border py-5 sm:grid-cols-2">
        <p className="flex gap-2 text-sm"><MapPin className="h-4 w-4 flex-shrink-0 text-primary" />{doctor.affiliation || 'Affiliation not listed'}{doctor.clinicAddress ? `, ${doctor.clinicAddress}` : ''}</p>
        <p className="flex gap-2 text-sm"><Languages className="h-4 w-4 flex-shrink-0 text-primary" />{doctor.languages.join(', ') || 'Languages not listed'}</p>
        <p className="text-sm">Consultations: {doctor.consultationModes.map((item) => item === 'in_person' ? 'In person' : 'Online').join(', ')}</p>
        <p className="text-sm">Fee: {doctor.consultationFee === null ? 'Not listed' : doctor.consultationFee}</p>
      </div>
      <div className="space-y-5 py-6">
        <section><h2 className="font-semibold">Professional biography</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{doctor.biography}</p></section>
        <section><h2 className="font-semibold">Areas of expertise</h2><p className="mt-2 text-sm text-muted-foreground">{doctor.expertise.join(', ') || 'Not listed'}</p></section>
        <section><h2 className="font-semibold">Clinical interests</h2><p className="mt-2 text-sm text-muted-foreground">{doctor.interests.join(', ') || 'Not listed'}</p></section>
        <section><h2 className="font-semibold">Availability</h2><p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{typeof doctor.availability === 'string' ? doctor.availability : JSON.stringify(doctor.availability, null, 2)}</p></section>
        <p className="text-xs text-muted-foreground">Professional registration is verified by the platform. This is not a ranking or endorsement of clinical quality. Patient reviews are not displayed.</p>
      </div>
      <Button asChild><Link href={`/app/patient/doctors/${doctor.id}/request`}>Request consultation</Link></Button>
    </CardContent></Card>
    <Card className="rounded-lg"><CardHeader><CardTitle className="text-base">Patient privacy</CardTitle></CardHeader><CardContent className="text-sm leading-relaxed text-muted-foreground">Your health information is not shared when you view a profile. If you request a consultation, you can choose which categories to share. You can change or withdraw that permission later.</CardContent></Card>
  </div>;
}
