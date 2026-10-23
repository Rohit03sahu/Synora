'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, ArrowRight, Languages, MapPin, Search, UserRound } from 'lucide-react';
import { apiGet } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

type Doctor = {
  id: string;
  fullName: string;
  specialty: string;
  qualifications: string;
  experienceYears: number;
  expertise: string[];
  affiliation: string;
  languages: string[];
  clinicAddress: string;
  consultationModes: string[];
  consultationFee: number | null;
  biography: string;
  photoUrl: string | null;
  verificationStatus: 'approved';
  conversationId?: string | null;
};

const specialties = ['Endocrinologist', 'Diabetologist', 'General Physician', 'Cardiologist', 'Nutritionist / Diabetes Educator'];

export default function PatientDoctorsPage() {
  const [view, setView] = useState<'find' | 'mine'>('find');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [myDoctors, setMyDoctors] = useState<Doctor[]>([]);
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [location, setLocation] = useState('');
  const [language, setLanguage] = useState('');
  const [mode, setMode] = useState('');
  const [minExperience, setMinExperience] = useState('');
  const [maxFee, setMaxFee] = useState('');
  const [availabilityDay, setAvailabilityDay] = useState('');
  const [sort, setSort] = useState('relevance');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      Object.entries({ search, specialty, location, language, mode, minExperience, maxFee, availabilityDay, sort }).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      try {
        const result = await apiGet<Doctor[]>(`/doctor/directory?${params.toString()}`);
        if (active) setDoctors(result);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Could not load the doctor directory.');
      } finally {
        if (active) setLoading(false);
      }
    }, search ? 250 : 0);
    return () => { active = false; window.clearTimeout(timeout); };
  }, [search, specialty, location, language, mode, minExperience, maxFee, availabilityDay, sort]);

  useEffect(() => {
    apiGet<Doctor[]>('/doctor/my-doctors').then(setMyDoctors).catch(() => setMyDoctors([]));
  }, []);

  const visibleDoctors = view === 'find' ? doctors : myDoctors;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="eyebrow">Care team</p><h1 className="mt-2 font-display text-2xl font-bold tracking-tight">Doctors</h1><p className="mt-1 text-sm text-muted-foreground">Find a verified professional or continue with your connected doctors.</p></div>
        <div className="inline-flex w-fit rounded-lg border border-border p-1" role="tablist" aria-label="Doctor views">
          <button role="tab" aria-selected={view === 'mine'} onClick={() => setView('mine')} className={`rounded-md px-3 py-2 text-sm ${view === 'mine' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>My Doctors ({myDoctors.length})</button>
          <button role="tab" aria-selected={view === 'find'} onClick={() => setView('find')} className={`rounded-md px-3 py-2 text-sm ${view === 'find' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>Find a Doctor</button>
        </div>
      </div>

      {view === 'find' && <section aria-label="Filter doctors" className="space-y-4 border-y border-border py-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search doctors" placeholder="Name or specialty" value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" /></div>
          <div><Label className="sr-only" htmlFor="doctor-specialty">Specialty</Label><select id="doctor-specialty" value={specialty} onChange={(event) => setSpecialty(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">All specialties</option>{specialties.map((item) => <option key={item}>{item}</option>)}</select></div>
          <Input aria-label="Location" placeholder="City or clinic" value={location} onChange={(event) => setLocation(event.target.value)} />
          <Input aria-label="Language" placeholder="Language" value={language} onChange={(event) => setLanguage(event.target.value)} />
          <select aria-label="Consultation mode" value={mode} onChange={(event) => setMode(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">Any consultation mode</option><option value="online">Online</option><option value="in_person">In person</option></select>
          <Input aria-label="Minimum years of experience" type="number" min="0" max="80" placeholder="Minimum years experience" value={minExperience} onChange={(event) => setMinExperience(event.target.value)} />
          <Input aria-label="Maximum fee" type="number" min="0" placeholder="Maximum fee" value={maxFee} onChange={(event) => setMaxFee(event.target.value)} />
          <select aria-label="Availability weekday" value={availabilityDay} onChange={(event) => setAvailabilityDay(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">Any availability</option>{['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => <option key={day}>{day}</option>)}</select>
          <select aria-label="Sort doctors" value={sort} onChange={(event) => setSort(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="relevance">Sort: name</option><option value="specialty">Sort: specialty</option><option value="experience">Sort: experience</option><option value="availability">Sort: availability</option></select>
        </div>
        <p className="text-xs text-muted-foreground">Directory includes approved profiles only. Sorting is not a clinical quality ranking.</p>
      </section>}

      {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
      {loading && view === 'find' && <p role="status" className="py-8 text-center text-sm text-muted-foreground">Loading verified doctors...</p>}
      {!loading && visibleDoctors.length === 0 && <div className="border-y border-dashed border-border py-12 text-center"><UserRound className="mx-auto h-8 w-8 text-muted-foreground" /><h2 className="mt-3 font-semibold">{view === 'mine' ? 'No connected doctors yet' : 'No doctors match these filters'}</h2><p className="mt-1 text-sm text-muted-foreground">{view === 'mine' ? 'After a doctor accepts your request, they will appear here.' : 'Try changing your search or filters.'}</p></div>}

      <div className="grid gap-4 lg:grid-cols-2">
        {visibleDoctors.map((doctor) => <Card key={doctor.id} className="overflow-hidden rounded-lg">
          <CardContent className="flex h-full flex-col p-5">
            <div className="flex gap-4">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-primary">
                {doctor.photoUrl ? <img src={doctor.photoUrl} alt={`${doctor.fullName}`} className="h-full w-full object-cover" /> : <UserRound className="h-7 w-7" aria-hidden="true" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{doctor.fullName}</h2><span className="inline-flex items-center gap-1 text-xs font-medium text-success"><span aria-hidden="true">✓</span> Verified</span></div>
                <p className="mt-0.5 text-sm text-primary">{doctor.specialty}</p>
                <p className="mt-1 text-xs text-muted-foreground">{doctor.qualifications} · {doctor.experienceYears} years experience</p>
              </div>
            </div>
            <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{doctor.biography}</p>
            <div className="mt-4 space-y-2 text-xs text-muted-foreground">
              {doctor.affiliation && <p className="flex items-center gap-2"><Activity className="h-3.5 w-3.5" />{doctor.affiliation}</p>}
              {doctor.clinicAddress && <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{doctor.clinicAddress}</p>}
              <p className="flex items-center gap-2"><Languages className="h-3.5 w-3.5" />{doctor.languages.join(', ') || 'Languages not listed'}</p>
              <p>{doctor.consultationModes.map((item) => item === 'in_person' ? 'In person' : 'Online').join(' · ')}{doctor.consultationFee !== null ? ` · Fee ${doctor.consultationFee}` : ' · Fee not listed'}</p>
            </div>
            {doctor.expertise.length > 0 && <p className="mt-3 text-xs"><span className="font-semibold">Expertise: </span><span className="text-muted-foreground">{doctor.expertise.join(', ')}</span></p>}
            <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
              <Button variant="outline" size="sm" asChild><Link href={`/app/patient/doctors/${doctor.id}`}>View Profile</Link></Button>
              {view === 'mine' && doctor.conversationId ? <Button size="sm" asChild><Link href={`/app/messages/${doctor.conversationId}`}>Open conversation <ArrowRight className="ml-2 h-3.5 w-3.5" /></Link></Button> : <Button size="sm" asChild><Link href={`/app/patient/doctors/${doctor.id}/request`}>Request consultation</Link></Button>}
            </div>
          </CardContent>
        </Card>)}
      </div>
    </div>
  );
}
