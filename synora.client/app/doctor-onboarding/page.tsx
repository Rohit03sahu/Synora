'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileCheck2, Phone, ShieldCheck, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { apiGet, apiSend, apiWrite } from '@/lib/api-client';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const specialtyOptions = ['Endocrinologist', 'Diabetologist', 'General Physician', 'Cardiologist', 'Nutritionist / Diabetes Educator'];
const interestOptions = ['Diabetes prevention', 'CGM interpretation', 'Insulin pump management', 'Precision medicine'];
type DoctorProfile = { userId: string; fullName: string; specialty: string; qualifications: string; registrationNumber: string; issuingCouncil: string; experienceYears: number; expertise: string[]; affiliation: string; languages: string[]; clinicAddress: string; consultationModes: string[]; consultationFee: number | null; biography: string; interests: string[]; availability: unknown; photoUrl: string | null; status: string; reviewNote: string | null };
type DoctorResponse = { profile: DoctorProfile | null; documentCount: number };

function csv(value: string) { return value.split(',').map((item) => item.trim()).filter(Boolean); }
function toBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    const end = Math.min(offset + 0x8000, bytes.length);
    for (let index = offset; index < end; index += 1) binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary);
}

export default function DoctorOnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [specialty, setSpecialty] = useState(specialtyOptions[0]);
  const [qualifications, setQualifications] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [issuingCouncil, setIssuingCouncil] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [expertise, setExpertise] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [languages, setLanguages] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [online, setOnline] = useState(true);
  const [inPerson, setInPerson] = useState(false);
  const [consultationFee, setConsultationFee] = useState('');
  const [biography, setBiography] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [availability, setAvailability] = useState('[]');
  const [photoUrl, setPhotoUrl] = useState('');
  const [documentCount, setDocumentCount] = useState(0);
  const [status, setStatus] = useState('draft');
  const [reviewNote, setReviewNote] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { if (!authLoading && !user) router.replace('/sign-in?next=doctor-onboarding'); }, [authLoading, user, router]);
  useEffect(() => {
    if (!user) return;
    setPhone(user.phone ?? '');
    setPhoneVerified(Boolean(user.phone_confirmed_at));
    apiGet<{ fullName: string }>('/me').then((profile) => setFullName(profile.fullName)).catch(() => undefined);
    apiGet<DoctorResponse>('/doctor/profile').then((result) => {
      const doctor = result.profile;
      setDocumentCount(result.documentCount);
      if (!doctor) return;
      setFullName(doctor.fullName);
      setSpecialty(doctor.specialty || specialtyOptions[0]); setQualifications(doctor.qualifications);
      setRegistrationNumber(doctor.registrationNumber); setIssuingCouncil(doctor.issuingCouncil);
      setExperienceYears(String(doctor.experienceYears)); setExpertise(doctor.expertise.join(', '));
      setAffiliation(doctor.affiliation); setLanguages(doctor.languages.join(', '));
      setClinicAddress(doctor.clinicAddress); setOnline(doctor.consultationModes.includes('online'));
      setInPerson(doctor.consultationModes.includes('in_person'));
      setConsultationFee(doctor.consultationFee === null ? '' : String(doctor.consultationFee));
      setBiography(doctor.biography); setInterests(doctor.interests);
      setAvailability(JSON.stringify(doctor.availability, null, 2)); setPhotoUrl(doctor.photoUrl ?? '');
      setStatus(doctor.status); setReviewNote(doctor.reviewNote ?? '');
    }).catch(() => undefined);
  }, [user]);

  const sendOtp = async () => {
    if (!phone.trim()) { toast.error('Enter a mobile number first.'); return; }
    setSendingOtp(true);
    const { error } = await supabase.auth.updateUser({ phone: phone.trim() });
    setSendingOtp(false);
    if (error) toast.error(error.message);
    else { setOtpSent(true); toast.success('SMS verification code sent.'); }
  };

  const verifyPhone = async () => {
    const { error } = await supabase.auth.verifyOtp({ phone: phone.trim(), token: otp, type: 'phone_change' });
    if (error) toast.error(error.message);
    else { setPhoneVerified(true); setOtpSent(false); toast.success('Mobile number verified.'); }
  };

  const uploadCredential = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Choose a file under 5 MB.'); return; }
    setUploading(true);
    try {
      await apiSend('/doctor/profile/documents', { fileName: file.name, contentType: file.type, fileBase64: toBase64(await file.arrayBuffer()) });
      setDocumentCount((count) => count + 1);
      toast.success('Credential uploaded securely.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not upload the credential.'); }
    finally { setUploading(false); }
  };

  const saveProfile = async () => {
    let parsedAvailability: unknown;
    try { parsedAvailability = JSON.parse(availability); } catch { throw new Error('Availability must be valid JSON, such as [] or a schedule object.'); }
    if (!Array.isArray(parsedAvailability) && (typeof parsedAvailability !== 'object' || parsedAvailability === null)) throw new Error('Availability must be a JSON array or object.');
    const modes = [online ? 'online' : '', inPerson ? 'in_person' : ''].filter(Boolean);
    if (!modes.length) throw new Error('Choose at least one consultation mode.');
    await apiWrite('/me', 'PUT', { fullName: fullName.trim(), phone: phone.trim() || null });
    await apiWrite('/doctor/profile', 'PUT', {
      specialty, qualifications: qualifications.trim(), registrationNumber: registrationNumber.trim(),
      issuingCouncil: issuingCouncil.trim(), experienceYears: Number(experienceYears), expertise: csv(expertise),
      affiliation: affiliation.trim(), languages: csv(languages), clinicAddress: clinicAddress.trim(),
      consultationModes: modes, consultationFee: consultationFee ? Number(consultationFee) : null,
      biography: biography.trim(), interests, availability: parsedAvailability, photoUrl: photoUrl.trim() || null,
    });
  };

  const saveDraft = async () => {
    setSaving(true);
    try { await saveProfile(); setStatus('draft'); toast.success('Professional profile saved.'); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Could not save profile.'); }
    finally { setSaving(false); }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!phoneVerified) { toast.error('Verify your mobile number before submitting.'); return; }
    setSaving(true);
    try {
      await saveProfile();
      await apiSend('/doctor/profile/submit', {});
      setStatus('pending_verification');
      toast.success('Credentials submitted for review.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not submit your application.'); }
    finally { setSaving(false); }
  };

  const statusLabel: Record<string, string> = { draft: 'Draft', pending_verification: 'Pending verification', approved: 'Approved', rejected: 'Rejected' };
  if (authLoading || !user) return <p role="status" className="p-10 text-center text-sm text-muted-foreground">Checking your sign-in...</p>;

  return <div className="mx-auto max-w-4xl space-y-6">
    <div><p className="eyebrow">Professional verification</p><h1 className="mt-2 font-display text-2xl font-bold">Doctor onboarding</h1><p className="mt-1 text-sm text-muted-foreground">Your profile is not discoverable until a platform administrator verifies your credentials.</p></div>
    <Card className="rounded-lg"><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4"><div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-primary" /><div><p className="text-sm font-semibold">Application status</p><p className="text-xs text-muted-foreground">{statusLabel[status] ?? status}</p></div></div>{status === 'approved' && <Button size="sm" onClick={() => router.push('/app/doctor')}>Open doctor dashboard</Button>}{status === 'rejected' && reviewNote && <p className="w-full text-sm text-destructive">Review note: {reviewNote}</p>}</CardContent></Card>
    {status === 'pending_verification' ? <Card className="rounded-lg"><CardContent className="space-y-2 p-6"><h2 className="font-semibold">Your credentials are under review</h2><p className="text-sm text-muted-foreground">You will receive an in-app notification when the review is complete. Profile editing is paused during verification.</p><Button variant="outline" asChild><Link href="/app/notifications">View notifications</Link></Button></CardContent></Card> : <form onSubmit={submit} className="space-y-5">
      <Card className="rounded-lg"><CardHeader><CardTitle className="text-base">Contact and professional profile</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="full-name">Full name</Label><Input id="full-name" required maxLength={200} value={fullName} onChange={(event) => setFullName(event.target.value)} /></div>
        <div className="space-y-2"><Label>Email</Label><Input value={user.email ?? ''} readOnly className="bg-muted/40" /></div>
        <div className="space-y-2"><Label htmlFor="phone">Mobile number</Label><Input id="phone" type="tel" required value={phone} onChange={(event) => { setPhone(event.target.value); setPhoneVerified(false); }} /></div>
        <div className="space-y-2"><Label>Mobile verification</Label><div className="flex gap-2"><Button type="button" variant="outline" onClick={sendOtp} disabled={sendingOtp || phoneVerified}>{phoneVerified ? 'Verified' : sendingOtp ? 'Sending...' : otpSent ? 'Resend code' : 'Send SMS code'}</Button>{phoneVerified && <span className="self-center text-xs text-success">Verified</span>}</div></div>
        {otpSent && <div className="flex items-end gap-2 sm:col-span-2"><div className="flex-1 space-y-2"><Label htmlFor="phone-otp">SMS code</Label><Input id="phone-otp" inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={(event) => setOtp(event.target.value)} /></div><Button type="button" onClick={verifyPhone} disabled={!otp}>Verify number</Button></div>}
        <div className="space-y-2"><Label htmlFor="specialty">Specialty</Label><select id="specialty" value={specialty} onChange={(event) => setSpecialty(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{specialtyOptions.map((item) => <option key={item}>{item}</option>)}</select></div>
        <div className="space-y-2"><Label htmlFor="qualifications">Medical degree and qualifications</Label><Input id="qualifications" required maxLength={500} value={qualifications} onChange={(event) => setQualifications(event.target.value)} placeholder="e.g. MBBS, MD" /></div>
        <div className="space-y-2"><Label htmlFor="registration">Medical registration number</Label><Input id="registration" required maxLength={100} value={registrationNumber} onChange={(event) => setRegistrationNumber(event.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="council">Issuing council</Label><Input id="council" required maxLength={200} value={issuingCouncil} onChange={(event) => setIssuingCouncil(event.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="experience">Years of experience</Label><Input id="experience" type="number" min="0" max="80" required value={experienceYears} onChange={(event) => setExperienceYears(event.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="affiliation">Hospital or clinic affiliation</Label><Input id="affiliation" maxLength={200} value={affiliation} onChange={(event) => setAffiliation(event.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="expertise">Areas of expertise (comma separated)</Label><Input id="expertise" maxLength={1000} value={expertise} onChange={(event) => setExpertise(event.target.value)} placeholder="Diabetes care, CGM interpretation" /></div>
        <div className="space-y-2"><Label htmlFor="languages">Consultation languages (comma separated)</Label><Input id="languages" required value={languages} onChange={(event) => setLanguages(event.target.value)} placeholder="English, Spanish" /></div>
        <div className="space-y-2 sm:col-span-2"><Label htmlFor="address">Clinic address</Label><Input id="address" maxLength={500} value={clinicAddress} onChange={(event) => setClinicAddress(event.target.value)} /></div>
        <fieldset className="space-y-2"><legend className="text-sm font-medium">Consultation mode</legend><label className="mr-4 inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={online} onChange={(event) => setOnline(event.target.checked)} />Online</label><label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={inPerson} onChange={(event) => setInPerson(event.target.checked)} />In person</label></fieldset>
        <div className="space-y-2"><Label htmlFor="fee">Consultation fee (optional)</Label><Input id="fee" type="number" min="0" step="0.01" value={consultationFee} onChange={(event) => setConsultationFee(event.target.value)} /></div>
        <div className="space-y-2 sm:col-span-2"><Label htmlFor="bio">Short professional biography</Label><Textarea id="bio" required maxLength={2000} rows={4} value={biography} onChange={(event) => setBiography(event.target.value)} /></div>
        <fieldset className="space-y-2 sm:col-span-2"><legend className="text-sm font-medium">Areas of interest</legend><div className="flex flex-wrap gap-x-5 gap-y-2">{interestOptions.map((item) => <label key={item} className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={interests.includes(item)} onChange={(event) => setInterests((current) => event.target.checked ? [...current, item] : current.filter((value) => value !== item))} />{item}</label>)}</div></fieldset>
        <div className="space-y-2 sm:col-span-2"><Label htmlFor="availability">Consultation availability (JSON schedule)</Label><Textarea id="availability" rows={3} value={availability} onChange={(event) => setAvailability(event.target.value)} /><p className="text-xs text-muted-foreground">Use a JSON array or object with day, start, and end fields.</p></div>
        <div className="space-y-2 sm:col-span-2"><Label htmlFor="photo">Profile photo URL (HTTPS)</Label><Input id="photo" type="url" placeholder="https://..." value={photoUrl} onChange={(event) => setPhotoUrl(event.target.value)} /></div>
      </CardContent></Card>
      <Card className="rounded-lg"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileCheck2 className="h-4 w-4 text-primary" />Credential documents</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-sm text-muted-foreground">Upload a registration certificate and relevant qualification documents. PDF, PNG, or JPEG up to 5 MB each. Documents are visible only to you and authorized platform administrators.</p><label className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-border p-4 text-sm hover:bg-muted/30"><Upload className="h-4 w-4" />{uploading ? 'Uploading...' : 'Choose credential document'}<input className="sr-only" type="file" accept="application/pdf,image/jpeg,image/png" disabled={uploading} onChange={(event) => { void uploadCredential(event.target.files?.[0]); event.currentTarget.value = ''; }} /></label><p className="text-xs text-muted-foreground">{documentCount} document{documentCount === 1 ? '' : 's'} uploaded</p></CardContent></Card>
      <div className="flex flex-wrap gap-3"><Button type="button" variant="outline" onClick={saveDraft} disabled={saving || uploading}>Save draft</Button><Button type="submit" disabled={saving || uploading || !phoneVerified || documentCount === 0}>{saving ? 'Submitting...' : 'Submit for verification'}</Button></div>
    </form>}
  </div>;
}
