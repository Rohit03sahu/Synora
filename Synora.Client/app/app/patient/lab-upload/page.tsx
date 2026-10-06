'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiGet, apiSend, apiWrite } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import type { LabResult } from '@/lib/types';

const statusColors = {
  normal: 'text-success bg-success/10',
  borderline: 'text-warning bg-warning/10',
  high: 'text-destructive bg-destructive/10',
  low: 'text-destructive bg-destructive/10',
};

const emptyLabResult = () => ({
  parameter: '',
  result: '',
  unit: '',
  reference: '',
  date: new Date().toISOString().slice(0, 10),
  status: 'normal' as LabResult['status'],
});

export default function LabUploadPage() {
  const { user } = useAuth();
  const [results, setResults] = useState<LabResult[]>([]);
  const [draft, setDraft] = useState(emptyLabResult);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshResults = async () => {
    setResults(await apiGet<LabResult[]>('/labs'));
  };

  useEffect(() => {
    if (!user) return;
    refreshResults()
      .catch((reason: unknown) => {
        const message = reason instanceof Error ? reason.message : 'Could not load lab results.';
        setError(message);
        console.error('Could not load lab results from the API.', reason);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleAddResult = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiSend<{ ids: string[] }>('/labs', [draft]);
      await refreshResults();
      setDraft(emptyLabResult());
      toast.success('Lab result saved');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Could not save lab result.';
      setError(message);
      console.error('Could not save a lab result.', reason);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiWrite(`/labs/${id}`, 'DELETE');
      setResults((current) => current.filter((result) => result.id !== id));
      toast.success('Lab result removed');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Could not delete lab result.';
      setError(message);
      console.error('Could not delete a lab result.', reason);
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Laboratory Results</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add verified results to your health record. Automated document extraction is not configured.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a Lab Result</CardTitle>
          <CardDescription>Enter values as shown on a report from your healthcare provider.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddResult} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="lab-parameter">Parameter</Label>
              <Input id="lab-parameter" maxLength={120} required value={draft.parameter}
                onChange={(event) => setDraft({ ...draft, parameter: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lab-result">Result</Label>
              <Input id="lab-result" maxLength={80} required value={draft.result}
                onChange={(event) => setDraft({ ...draft, result: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lab-unit">Unit</Label>
              <Input id="lab-unit" maxLength={40} value={draft.unit}
                onChange={(event) => setDraft({ ...draft, unit: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lab-reference">Reference range</Label>
              <Input id="lab-reference" maxLength={120} value={draft.reference}
                onChange={(event) => setDraft({ ...draft, reference: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lab-date">Date</Label>
              <Input id="lab-date" type="date" required value={draft.date}
                onChange={(event) => setDraft({ ...draft, date: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={draft.status} onValueChange={(status: LabResult['status']) => setDraft({ ...draft, status })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="borderline">Borderline</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Lab Result'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Saved Lab Results</CardTitle>
          <CardDescription>Results saved to your health record</CardDescription>
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
              {results.map((result) => (
                <TableRow key={result.id}>
                  <TableCell className="font-medium">{result.parameter}</TableCell>
                  <TableCell className="text-right font-semibold">{result.result}</TableCell>
                  <TableCell className="text-muted-foreground">{result.unit}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{result.reference}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{result.date}</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors[result.status]}`}>
                      {result.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" aria-label={`Delete ${result.parameter}`} onClick={() => result.id && handleDelete(result.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && !results.length && (
                <TableRow><TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  No lab results have been saved.
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          {loading && <p className="mt-4 text-sm text-muted-foreground">Loading results...</p>}
        </CardContent>
      </Card>
    </div>
  );
}
