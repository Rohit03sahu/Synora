'use client';

import { useState, useEffect } from 'react';
import { Bell, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { apiGet, apiWrite } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

interface NotificationPrefs {
  assessmentUpdates: boolean;
  dataSourceAlerts: boolean;
  labProcessing: boolean;
  weeklySummary: boolean;
  productUpdates: boolean;
}

export default function DoctorSettingsPage() {
  const { profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [notifications, setNotifications] = useState<NotificationPrefs>({
    assessmentUpdates: true,
    dataSourceAlerts: true,
    labProcessing: true,
    weeklySummary: false,
    productUpdates: false,
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setEmail(profile.email);
      setPhone(profile.phone || '');
    }
  }, [profile]);

  useEffect(() => {
    apiGet<NotificationPrefs>('/notifications')
      .then(setNotifications)
      .catch((error: unknown) => {
        console.error('Could not load notification preferences.', error);
      })
      .finally(() => setLoadingNotifications(false));
  }, []);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await apiWrite('/me', 'PUT', { fullName, phone });
      await refreshProfile();
      toast.success('Profile updated');
    } catch (error) {
      console.error('Could not save profile.', error);
      toast.error(error instanceof Error ? error.message : 'Could not save profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSavingNotifications(true);
    try {
      await apiWrite('/notifications', 'PUT', notifications);
      toast.success('Notification preferences saved');
    } catch (error) {
      console.error('Could not save notification preferences.', error);
      toast.error(error instanceof Error ? error.message : 'Could not save notification preferences.');
    } finally {
      setSavingNotifications(false);
    }
  };

  const notificationItems = [
    { key: 'assessmentUpdates' as const, label: 'New patient assessment', desc: 'When a patient completes an assessment' },
    { key: 'dataSourceAlerts' as const, label: 'High-risk alerts', desc: 'When a patient is flagged as elevated risk' },
    { key: 'labProcessing' as const, label: 'Lab processing', desc: 'When lab extraction is complete for a patient' },
    { key: 'weeklySummary' as const, label: 'Weekly summary', desc: 'Weekly patient summary email' },
    { key: 'productUpdates' as const, label: 'Product updates', desc: 'New features and announcements' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your clinical account</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>Your professional information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Dr. Jane Smith" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={email} readOnly className="bg-muted/50" />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
          </div>
          <Button onClick={handleSaveProfile} disabled={savingProfile}>
            <Save className="mr-2 h-4 w-4" />
            {savingProfile ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">Notifications</CardTitle>
              <CardDescription>Manage how you receive updates</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingNotifications ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {notificationItems.map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={notifications[item.key]}
                    onCheckedChange={(checked) => setNotifications((current) => ({ ...current, [item.key]: checked }))}
                  />
                </div>
              ))}
              <Button onClick={handleSaveNotifications} disabled={savingNotifications}>
                <Save className="mr-2 h-4 w-4" />
                {savingNotifications ? 'Saving...' : 'Save Notification Preferences'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
