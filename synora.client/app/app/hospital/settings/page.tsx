'use client';

import { Building2, Users, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function HospitalSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Hospital administration settings</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Organization</CardTitle><CardDescription>Hospital information</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Hospital Name</Label><Input defaultValue="Metropolitan General Hospital" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Admin Name</Label><Input defaultValue="Admin User" /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" defaultValue="admin@metrogh.com" /></div>
          </div>
          <Button><Save className="mr-2 h-4 w-4" />Save</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Departments</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {['Endocrinology', 'Internal Medicine', 'Cardiology', 'Preventive Care'].map((dept) => (
            <div key={dept} className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm font-medium">{dept}</span>
              <span className="text-xs text-muted-foreground">12 staff</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
