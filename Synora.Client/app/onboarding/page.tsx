'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  User,
  Heart,
  Users,
  Activity,
  Droplet,
  Watch,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { SynoraHealthLogo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { apiWrite } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

const steps = [
  { id: 'personal', label: 'Personal', icon: User },
  { id: 'medical', label: 'Medical', icon: Heart },
  { id: 'family', label: 'Family', icon: Users },
  { id: 'lifestyle', label: 'Lifestyle', icon: Activity },
  { id: 'diabetes', label: 'Diabetes', icon: Droplet },
  { id: 'devices', label: 'Devices', icon: Watch },
  { id: 'review', label: 'Review', icon: CheckCircle2 },
];

interface OnboardingFormData {
  personal: { firstName: string; lastName: string; dob: string; gender: string; height: string; weight: string };
  medical: { conditions: string[]; medications: string; lastCheckup: string };
  family: { hasFamilyHistory: string; members: string[]; otherHistory: string };
  lifestyle: { diet: string; exercise: string; sleep: string; stress: string; smoking: string };
  diabetes: { diagnosis: string; hba1c: string; fastingGlucose: string };
  devices: string[];
}

const initialData: OnboardingFormData = {
  personal: { firstName: '', lastName: '', dob: '', gender: '', height: '', weight: '' },
  medical: { conditions: [], medications: '', lastCheckup: '' },
  family: { hasFamilyHistory: 'no', members: [], otherHistory: '' },
  lifestyle: { diet: '', exercise: '', sleep: '', stress: '', smoking: '' },
  diabetes: { diagnosis: '', hba1c: '', fastingGlucose: '' },
  devices: [],
};

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<OnboardingFormData>(initialData);

  const updateField = <K extends keyof OnboardingFormData>(
    section: K,
    field: string,
    value: string | string[],
  ) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const toggleArrayItem = (section: 'medical' | 'family' | 'devices', field: string, item: string) => {
    setFormData((prev) => {
      const current = prev[section][field as keyof typeof prev[typeof section]] as string[];
      const exists = Array.isArray(current) && current.includes(item);
      const updated = Array.isArray(current)
        ? exists ? current.filter((i) => i !== item) : [...current, item]
        : [item];
      return { ...prev, [section]: { ...prev[section], [field]: updated } };
    });
  };

  const next = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
    else handleComplete();
  };

  const prev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleComplete = async () => {
    if (!user) {
      router.push('/app/patient');
      return;
    }
    setSaving(true);
    try {
      await apiWrite('/onboarding', 'PUT', {
        personalInfo: formData.personal,
        medicalHistory: formData.medical,
        familyHistory: formData.family,
        lifestyle: formData.lifestyle,
        diabetesHistory: formData.diabetes,
        devices: formData.devices,
        completed: true,
      });
    } catch (error) {
      console.error('Could not save onboarding data.', error);
      toast.error(error instanceof Error ? error.message : 'Could not save your profile. Please try again.');
      setSaving(false);
      return;
    }
    setSaving(false);
    toast.success('Health profile saved!');
    router.push('/app/patient');
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <header className="border-b border-border/60 bg-background">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <SynoraHealthLogo />
          <Button variant="ghost" size="sm" onClick={() => router.push('/app/patient')}>
            Skip for now
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-2xl space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold tracking-tight">
              Let&rsquo;s Build Your Health Profile
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length} — {steps[currentStep].label}
            </p>
          </div>

          {/* Progress bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-1">
              {steps.map((step, i) => {
                const Icon = step.icon;
                const isCompleted = i < currentStep;
                const isCurrent = i === currentStep;
                return (
                  <div key={step.id} className="flex items-center gap-1 flex-1">
                    <div className={cn(
                      'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium transition-all',
                      isCompleted ? 'bg-success text-success-foreground' :
                      isCurrent ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' :
                      'bg-muted text-muted-foreground'
                    )}>
                      {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    {i < steps.length - 1 && (
                      <div className={cn(
                        'h-0.5 flex-1 rounded-full transition-colors',
                        isCompleted ? 'bg-success' : 'bg-border'
                      )} />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Step content */}
          <div className="rounded-xl border border-border bg-card p-6 sm:p-8 min-h-[300px]">
            {currentStep === 0 && (
              <div className="space-y-4 animate-fade-in-up">
                <h2 className="text-lg font-semibold">Personal Information</h2>
                <p className="text-sm text-muted-foreground">Let's start with some basic information about you.</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="John" value={formData.personal.firstName} onChange={(e) => updateField('personal', 'firstName', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Doe" value={formData.personal.lastName} onChange={(e) => updateField('personal', 'lastName', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input id="dob" type="date" value={formData.personal.dob} onChange={(e) => updateField('personal', 'dob', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={formData.personal.gender} onValueChange={(v) => updateField('personal', 'gender', v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input id="height" type="number" placeholder="175" value={formData.personal.height} onChange={(e) => updateField('personal', 'height', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input id="weight" type="number" placeholder="70" value={formData.personal.weight} onChange={(e) => updateField('personal', 'weight', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4 animate-fade-in-up">
                <h2 className="text-lg font-semibold">Medical History</h2>
                <p className="text-sm text-muted-foreground">Tell us about your medical background.</p>
                <div className="space-y-3">
                  <Label>Have you been diagnosed with any of these conditions?</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Hypertension', 'High Cholesterol', 'Heart Disease', 'Kidney Disease', 'Thyroid Condition', 'PCOS'].map((cond) => (
                      <label key={cond} className="flex items-center gap-2 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/40">
                        <Checkbox
                          checked={formData.medical.conditions.includes(cond)}
                          onCheckedChange={() => toggleArrayItem('medical', 'conditions', cond)}
                        />
                        <span className="text-sm">{cond}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Are you currently taking any medications?</Label>
                  <Textarea placeholder="List any medications you are currently taking..." value={formData.medical.medications} onChange={(e) => updateField('medical', 'medications', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Last check-up date</Label>
                  <Input type="date" value={formData.medical.lastCheckup} onChange={(e) => updateField('medical', 'lastCheckup', e.target.value)} />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4 animate-fade-in-up">
                <h2 className="text-lg font-semibold">Family History</h2>
                <p className="text-sm text-muted-foreground">Understanding your family history helps assess genetic risk factors.</p>
                <div className="space-y-3">
                  <Label>Does anyone in your immediate family have diabetes?</Label>
                  <RadioGroup value={formData.family.hasFamilyHistory} onValueChange={(v) => updateField('family', 'hasFamilyHistory', v)}>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <RadioGroupItem value="yes" /> <span className="text-sm">Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <RadioGroupItem value="no" /> <span className="text-sm">No</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <RadioGroupItem value="unsure" /> <span className="text-sm">Not sure</span>
                      </label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-3">
                  <Label>Which family members? (Select all that apply)</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Father', 'Mother', 'Sibling', 'Grandparent', 'Aunt/Uncle', 'Cousin'].map((rel) => (
                      <label key={rel} className="flex items-center gap-2 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/40">
                        <Checkbox
                          checked={formData.family.members.includes(rel)}
                          onCheckedChange={() => toggleArrayItem('family', 'members', rel)}
                        />
                        <span className="text-sm">{rel}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Any other family history of metabolic conditions?</Label>
                  <Textarea placeholder="Describe any other relevant family history..." value={formData.family.otherHistory} onChange={(e) => updateField('family', 'otherHistory', e.target.value)} />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4 animate-fade-in-up">
                <h2 className="text-lg font-semibold">Lifestyle</h2>
                <p className="text-sm text-muted-foreground">Your daily habits play an important role in metabolic health.</p>
                <div className="space-y-3">
                  <Label>How would you describe your diet?</Label>
                  <Select value={formData.lifestyle.diet} onValueChange={(v) => updateField('lifestyle', 'diet', v)}>
                    <SelectTrigger><SelectValue placeholder="Select diet type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="balanced">Balanced / Varied</SelectItem>
                      <SelectItem value="low-carb">Low Carbohydrate</SelectItem>
                      <SelectItem value="mediterranean">Mediterranean</SelectItem>
                      <SelectItem value="vegetarian">Vegetarian</SelectItem>
                      <SelectItem value="vegan">Vegan</SelectItem>
                      <SelectItem value="high-sugar">High Sugar / Processed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label>How often do you exercise?</Label>
                  <RadioGroup value={formData.lifestyle.exercise} onValueChange={(v) => updateField('lifestyle', 'exercise', v)}>
                    <div className="flex flex-col gap-2">
                      {['Rarely / Never', '1-2 times per week', '3-4 times per week', '5+ times per week'].map((opt) => (
                        <label key={opt} className="flex items-center gap-2 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/40">
                          <RadioGroupItem value={opt} /> <span className="text-sm">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Average sleep hours</Label>
                    <Input type="number" placeholder="7" value={formData.lifestyle.sleep} onChange={(e) => updateField('lifestyle', 'sleep', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Stress level (1-10)</Label>
                    <Input type="number" min={1} max={10} placeholder="5" value={formData.lifestyle.stress} onChange={(e) => updateField('lifestyle', 'stress', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Do you smoke?</Label>
                  <RadioGroup value={formData.lifestyle.smoking} onValueChange={(v) => updateField('lifestyle', 'smoking', v)}>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="no" /> <span className="text-sm">No</span></label>
                      <label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="former" /> <span className="text-sm">Former</span></label>
                      <label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="yes" /> <span className="text-sm">Yes</span></label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4 animate-fade-in-up">
                <h2 className="text-lg font-semibold">Diabetes History</h2>
                <p className="text-sm text-muted-foreground">Any previous diabetes-related assessments or diagnoses.</p>
                <div className="space-y-3">
                  <Label>Have you ever been diagnosed with diabetes or prediabetes?</Label>
                  <RadioGroup value={formData.diabetes.diagnosis} onValueChange={(v) => updateField('diabetes', 'diagnosis', v)}>
                    <div className="flex flex-col gap-2">
                      {['No', 'Prediabetes', 'Type 1 Diabetes', 'Type 2 Diabetes', 'Gestational Diabetes'].map((opt) => (
                        <label key={opt} className="flex items-center gap-2 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/40">
                          <RadioGroupItem value={opt} /> <span className="text-sm">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label>Latest HbA1c value (if known)</Label>
                  <Input type="text" placeholder="e.g., 5.8%" value={formData.diabetes.hba1c} onChange={(e) => updateField('diabetes', 'hba1c', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Latest fasting glucose (if known)</Label>
                  <Input type="text" placeholder="e.g., 95 mg/dL" value={formData.diabetes.fastingGlucose} onChange={(e) => updateField('diabetes', 'fastingGlucose', e.target.value)} />
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-4 animate-fade-in-up">
                <h2 className="text-lg font-semibold">Connected Devices</h2>
                <p className="text-sm text-muted-foreground">Which health devices or apps do you currently use?</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: 'CGM Sensor', desc: 'Continuous Glucose Monitor' },
                    { name: 'Insulin Pump', desc: 'Insulin delivery device' },
                    { name: 'Fitness Tracker', desc: 'Smartwatch or band' },
                    { name: 'Blood Pressure Monitor', desc: 'BP measurement device' },
                    { name: 'Smart Scale', desc: 'Weight & body composition' },
                    { name: 'Sleep Tracker', desc: 'Sleep monitoring app' },
                  ].map((dev) => (
                    <label key={dev.name} className="flex items-start gap-3 rounded-lg border border-border p-4 cursor-pointer hover:bg-muted/40">
                      <Checkbox
                        checked={formData.devices.includes(dev.name)}
                        onCheckedChange={() => toggleArrayItem('devices', 'items', dev.name)}
                      />
                      <div>
                        <p className="text-sm font-medium">{dev.name}</p>
                        <p className="text-xs text-muted-foreground">{dev.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <p className="text-xs text-muted-foreground">
                    You can connect devices later from your profile. GenoGluco will request
                    appropriate permissions for each data source.
                  </p>
                </div>
              </div>
            )}

            {currentStep === 6 && (
              <div className="space-y-4 animate-fade-in-up">
                <div className="text-center space-y-3">
                  <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-success/10">
                    <CheckCircle2 className="h-8 w-8 text-success" />
                  </div>
                  <h2 className="text-lg font-semibold">Review &amp; Complete</h2>
                  <p className="text-sm text-muted-foreground">
                    Your health profile is ready. You can update any of this information later from
                    your profile settings.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
                  {steps.slice(0, -1).map((step) => (
                    <div key={step.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <step.icon className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{step.label}</span>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-success">
                        <Check className="h-3 w-3" /> Completed
                      </span>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
                  <p className="text-xs text-muted-foreground">
                    Next step: Connect your lab reports, CGM data, and other health sources to
                    enable Synora Intelligence analysis.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={prev} disabled={currentStep === 0}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={next} disabled={saving}>
              {saving ? 'Saving...' : currentStep === steps.length - 1 ? 'Enter GenoGluco' : 'Continue'}
              {!saving && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
