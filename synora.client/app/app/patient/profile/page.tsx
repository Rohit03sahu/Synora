'use client';

import {
  User,
  Heart,
  Users,
  Activity,
  Droplet,
  Watch,
  FlaskConical,
  Dna,
  Settings,
  Shield,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const profileSections = [
  { label: 'Personal Information', icon: User, status: 'complete', completeness: 100 },
  { label: 'Medical History', icon: Heart, status: 'complete', completeness: 100 },
  { label: 'Family History', icon: Users, status: 'complete', completeness: 100 },
  { label: 'Lifestyle', icon: Activity, status: 'complete', completeness: 90 },
  { label: 'Diabetes History', icon: Droplet, status: 'complete', completeness: 100 },
  { label: 'Laboratory', icon: FlaskConical, status: 'complete', completeness: 100 },
  { label: 'CGM', icon: Activity, status: 'connected', completeness: 85 },
  { label: 'Insulin', icon: Watch, status: 'not_connected', completeness: 0 },
  { label: 'Genomics', icon: Dna, status: 'partial', completeness: 40 },
  { label: 'Connected Devices', icon: Watch, status: 'partial', completeness: 50 },
  { label: 'Consent & Privacy', icon: Shield, status: 'complete', completeness: 100 },
];

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">My GenoGluco Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your health information and data sources</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Profile Completeness</CardTitle>
              <CardDescription>Overall data completeness across all sections</CardDescription>
            </div>
            <span className="text-2xl font-bold text-primary">82%</span>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={82} className="h-3" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {profileSections.map((section) => {
          const Icon = section.icon;
          const isComplete = section.completeness === 100;
          const isNotConnected = section.completeness === 0;
          return (
            <Card key={section.label} className="transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">{section.label}</CardTitle>
                      <div className="flex items-center gap-1 mt-0.5">
                        {isComplete ? (
                          <span className="flex items-center gap-1 text-xs text-success">
                            <CheckCircle2 className="h-3 w-3" /> Complete
                          </span>
                        ) : isNotConnected ? (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <AlertCircle className="h-3 w-3" /> Not Connected
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-warning">
                            <AlertCircle className="h-3 w-3" /> Partial ({section.completeness}%)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Progress value={section.completeness} className="h-1.5" />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
