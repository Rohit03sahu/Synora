'use client';

import { useState, useEffect } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { mockLabResults } from '@/lib/mock-data';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import type { LabResult } from '@/lib/types';

const statusColors = {
  normal: 'text-success bg-success/10',
  borderline: 'text-warning bg-warning/10',
  high: 'text-destructive bg-destructive/10',
  low: 'text-destructive bg-destructive/10',
};

export default function LabUploadPage() {
  const { user } = useAuth();
  const [stage, setStage] = useState<'upload' | 'processing' | 'extracted' | 'confirmed'>('upload');
  const [savedResults, setSavedResults] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('lab_results')
        .select('id, parameter, result, unit, reference, date, status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data) {
        setSavedResults(data as LabResult[]);
      }
      setLoading(false);
    })();
  }, [user]);

  const handleUpload = () => {
    setStage('processing');
    setTimeout(() => setStage('extracted'), 2000);
  };

  const handleConfirm = async () => {
    if (!user) return;
    const rows = mockLabResults.map((r) => ({
      user_id: user.id,
      parameter: r.parameter,
      result: r.result,
      unit: r.unit,
      reference: r.reference,
      date: r.date,
      status: r.status,
    }));
    const { error } = await supabase.from('lab_results').insert(rows);
    if (error) {
      toast.error('Could not save lab results');
      return;
    }
    await supabase.from('audit_trail').insert({
      user_id: user.id,
      action: 'Lab report uploaded',
      actor: user.email || 'User',
    });
    setStage('confirmed');
    const { data } = await supabase
      .from('lab_results')
      .select('id, parameter, result, unit, reference, date, status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setSavedResults(data as LabResult[]);
    toast.success('Lab results saved to your health record');
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('lab_results').delete().eq('id', id);
    if (error) {
      toast.error('Could not delete result');
      return;
    }
    setSavedResults((prev) => prev.filter((r) => r.id !== id));
    toast.success('Result removed');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Add Your Laboratory Results</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload your lab report and GenoGluco will extract the values for you to verify
        </p>
      </div>

      {/* Workflow indicator */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {['Upload', 'Processing', 'Extraction', 'Validation', 'Confirmation', 'Analysis'].map((step, i, arr) => {
          const stepIndex = ['upload', 'processing', 'extracted', 'confirmed'].indexOf(stage);
          const isDone = i < (stage === 'upload' ? 0 : stage === 'processing' ? 1 : stage === 'extracted' ? 2 : 4);
          const isCurrent = i === (stage === 'upload' ? 0 : stage === 'processing' ? 1 : stage === 'extracted' ? 2 : 4);
          return (
            <div key={step} className="flex items-center gap-2">
              <span className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium',
                isDone ? 'bg-success/10 text-success' : isCurrent ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              )}>
                {step}
              </span>
              {i < arr.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
            </div>
          );
        })}
      </div>

      {stage === 'upload' && (
        <Card>
          <CardContent className="pt-6">
            <div
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-12 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
              onClick={handleUpload}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                <Upload className="h-8 w-8" />
              </div>
              <h3 className="text-base font-semibold">Upload Lab Report</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Drag and drop or click to browse
              </p>
              <div className="flex gap-2 mt-4">
                {['PDF', 'JPG', 'PNG'].map((fmt) => (
                  <span key={fmt} className="rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium">
                    {fmt}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {stage === 'processing' && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <h3 className="text-base font-semibold">Processing Your Lab Report</h3>
              <p className="text-sm text-muted-foreground mt-1">
                OCR extraction and clinical parameter identification in progress...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {(stage === 'extracted' || stage === 'confirmed') && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">lab_report_sep2026.pdf</CardTitle>
                    <CardDescription className="text-sm">Extracted parameters — please verify</CardDescription>
                  </div>
                </div>
                {stage === 'confirmed' && (
                  <span className="flex items-center gap-1 text-sm text-success">
                    <CheckCircle2 className="h-4 w-4" /> Verified
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parameter</TableHead>
                    <TableHead className="text-right">Result</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockLabResults.map((result) => (
                    <TableRow key={result.parameter}>
                      <TableCell className="font-medium">{result.parameter}</TableCell>
                      <TableCell className="text-right font-semibold">{result.result}</TableCell>
                      <TableCell className="text-muted-foreground">{result.unit}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{result.reference}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{result.date}</TableCell>
                      <TableCell>
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium capitalize', statusColors[result.status])}>
                          {result.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {stage === 'extracted' && (
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setStage('upload')}>
                Re-upload
              </Button>
              <Button onClick={handleConfirm}>
                Confirm &amp; Run Analysis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {stage === 'confirmed' && (
            <Card className="border-success/30 bg-success/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-success flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">Lab Results Verified</p>
                    <p className="text-xs text-muted-foreground">
                      Your results have been added to your health record. Synora Intelligence will include
                      them in your next assessment.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Saved results */}
      {savedResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your Saved Lab Results</CardTitle>
            <CardDescription>All uploaded and verified lab parameters</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parameter</TableHead>
                  <TableHead className="text-right">Result</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {savedResults.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell className="font-medium">{result.parameter}</TableCell>
                    <TableCell className="text-right font-semibold">{result.result}</TableCell>
                    <TableCell className="text-muted-foreground">{result.unit}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{result.reference}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{result.date}</TableCell>
                    <TableCell>
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium capitalize', statusColors[result.status])}>
                        {result.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => result.id && handleDelete(result.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
