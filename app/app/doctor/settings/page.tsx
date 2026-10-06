'use client';

import { User, Bell, Lock, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function DoctorSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your clinical account</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Profile</CardTitle><CardDescription>Your professional information</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>First Name</Label><Input defaultValue="Sarah" /></div>
            <div className="space-y-2"><Label>Last Name</Label><Input defaultValue="Smith" /></div>
          </div>
          <div className="space-y-2"><Label>Email</Label><Input type="email" defaultValue="dr.smith@hospital.com" /></div>
          <div className="space-y-2"><Label>License Number</Label><Input defaultValue="MD-12345" /></div>
          <Button><Save className="mr-2 h-4 w-4" />Save</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[{ label: 'New patient assessment', desc: 'When a patient completes assessment' }, { label: 'High-risk alerts', desc: 'When a patient is flagged elevated' }].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div><p className="text-sm font-medium">{item.label}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
              <Switch defaultChecked />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
