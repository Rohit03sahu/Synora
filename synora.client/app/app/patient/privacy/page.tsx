'use client';

import { useState, useEffect } from 'react';
import { Shield, Lock, Eye, FileCheck, History, Download, CheckCircle2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { apiGet, apiWrite } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

const consentItems = [
  { key: 'lab_data', label: 'Laboratory Data', desc: 'Process and analyze uploaded lab reports' },
  { key: 'cgm_data', label: 'CGM Data', desc: 'Access continuous glucose monitoring data' },
  { key: 'genomic_data', label: 'Genomic Data', desc: 'Analyze genetic variants and polygenic risk' },
  { key: 'lifestyle_data', label: 'Lifestyle Data', desc: 'Process diet, activity, and sleep information' },
  { key: 'insulin_device_data', label: 'Insulin & Device Data', desc: 'Access insulin pump and device data' },
  { key: 'share_with_doctor', label: 'Share With Doctor', desc: 'Allow sharing assessment with authorized doctors' },
  { key: 'research_participation', label: 'Research Participation', desc: 'Contribute anonymized data to research' },
] as const;

type ConsentKey = typeof consentItems[number]['key'];

interface AuditEntry {
  id: string;
  action: string;
  actor: string;
  createdAt: string;
}

export default function PrivacyPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [consents, setConsents] = useState<Record<ConsentKey, boolean>>({
    lab_data: true,
    cgm_data: true,
    genomic_data: true,
    lifestyle_data: true,
    insulin_device_data: false,
    share_with_doctor: true,
    research_participation: false,
  });
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [consentData, auditData] = await Promise.all([
          apiGet<{
            labData: boolean;
            cgmData: boolean;
            genomicData: boolean;
            lifestyleData: boolean;
            insulinDeviceData: boolean;
            shareWithDoctor: boolean;
            researchParticipation: boolean;
          }>('/consent'),
          apiGet<AuditEntry[]>('/audit?limit=10'),
        ]);
        setConsents({
          lab_data: consentData.labData,
          cgm_data: consentData.cgmData,
          genomic_data: consentData.genomicData,
          lifestyle_data: consentData.lifestyleData,
          insulin_device_data: consentData.insulinDeviceData,
          share_with_doctor: consentData.shareWithDoctor,
          research_participation: consentData.researchParticipation,
        });
        setAuditTrail(auditData);
      } catch (error) {
        console.error('Could not load privacy settings from the API.', error);
        toast.error(error instanceof Error ? error.message : 'Could not load privacy settings.');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handleToggle = (key: ConsentKey, value: boolean) => {
    setConsents((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await apiWrite('/consent', 'PUT', {
        labData: consents.lab_data,
        cgmData: consents.cgm_data,
        genomicData: consents.genomic_data,
        lifestyleData: consents.lifestyle_data,
        insulinDeviceData: consents.insulin_device_data,
        shareWithDoctor: consents.share_with_doctor,
        researchParticipation: consents.research_participation,
      });
      toast.success('Consent settings saved');
    } catch (error) {
      console.error('Could not save consent settings.', error);
      toast.error(error instanceof Error ? error.message : 'Could not save consent settings.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Privacy &amp; Consent</h1>
        <p className="text-sm text-muted-foreground mt-1">Control how your health data is used and shared</p>
      </div>

      {/* Privacy overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { icon: Shield, label: 'Your Data', desc: 'You own your health data' },
          { icon: Lock, label: 'Your Consent', desc: 'You control what is processed' },
          { icon: Eye, label: 'Transparency', desc: 'See exactly how data is used' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label}>
              <CardContent className="pt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Consent management */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileCheck className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">Consent Management</CardTitle>
              <CardDescription>Toggle consent for each data type and usage</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {consentItems.map((item) => (
            <div key={item.key} className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{item.label}</p>
                  {consents[item.key] && (
                    <span className="flex items-center gap-1 text-xs text-success">
                      <CheckCircle2 className="h-3 w-3" /> Granted
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
              <Switch
                checked={consents[item.key]}
                onCheckedChange={(v) => handleToggle(item.key, !!v)}
              />
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Consent Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit trail */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <History className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">Audit Trail</CardTitle>
              <CardDescription>Complete record of data access and changes</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {auditTrail.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No activity recorded yet</p>
          ) : (
            auditTrail.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <div>
                    <p className="text-sm font-medium">{entry.action}</p>
                    <p className="text-xs text-muted-foreground">by {entry.actor}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(entry.createdAt)}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Data rights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Data Rights</CardTitle>
          <CardDescription>Exercise your rights regarding your health data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="text-sm font-medium">Download All My Data</p>
              <p className="text-xs text-muted-foreground">Export a copy of all your health data</p>
            </div>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-3.5 w-3.5" />
              Export
            </Button>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="text-sm font-medium">View Privacy Policy</p>
              <p className="text-xs text-muted-foreground">Read our full privacy policy</p>
            </div>
            <Button variant="outline" size="sm">View</Button>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-destructive/30 p-4">
            <div>
              <p className="text-sm font-medium text-destructive">Delete All My Data</p>
              <p className="text-xs text-muted-foreground">Permanently remove all health data</p>
            </div>
            <Button variant="destructive" size="sm">Delete</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
