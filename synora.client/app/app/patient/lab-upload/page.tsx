'use client';

import { useEffect, useRef, useState } from 'react';
import { FileText, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiGet, apiSend, apiWrite } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { extractLabResults } from '@/lib/ocr-api';
import type { LabResult, OcrLabResult } from '@/lib/types';

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
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrResults, setOcrResults] = useState<OcrLabResult[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [savingOcrResults, setSavingOcrResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ocrFileInput = useRef<HTMLInputElement>(null);

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

  const handleExtract = async () => {
    if (!ocrFile) return;
    setError(null);
    setExtracting(true);
    try {
      const extracted = await extractLabResults(ocrFile);
      setOcrResults(extracted);
      if (extracted.length) {
        toast.success(`Found ${extracted.length} possible lab result${extracted.length === 1 ? '' : 's'}`);
      } else {
        toast.info('No readable lab results were found in that image.');
      }
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Could not read the lab report.';
      setError(message);
      console.error('Could not extract lab results from the report image.', reason);
      toast.error(message);
    } finally {
      setExtracting(false);
    }
  };

  const updateOcrResult = (index: number, field: keyof OcrLabResult, value: string) => {
    setOcrResults((current) => current.map((result, row) =>
      row === index ? { ...result, [field]: value } : result));
  };

  const handleSaveOcrResults = async () => {
    setError(null);
    setSavingOcrResults(true);
    try {
      await apiSend<{ ids: string[] }>('/labs', ocrResults);
      setOcrResults([]);
      setOcrFile(null);
      if (ocrFileInput.current) ocrFileInput.current.value = '';
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Could not save lab results.';
      setError(message);
      console.error('Could not save reviewed OCR lab results.', reason);
      toast.error(message);
      setSavingOcrResults(false);
      return;
    }

    try {
      await refreshResults();
      toast.success('Reviewed lab results saved');
    } catch (reason) {
      const message = 'Lab results were saved, but the list could not be refreshed.';
      setError(message);
      console.error('Could not refresh lab results after saving OCR results.', reason);
      toast.error(message);
    } finally {
      setSavingOcrResults(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Laboratory Results</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review results from your reports and add them to your health record.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Extract results from a report
          </CardTitle>
          <CardDescription>
            Upload a clear PNG, JPEG, or WebP image (up to 10 MB). Foundry OCR suggestions must be
            checked by you before they are saved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="lab-report-image">Lab report image</Label>
              <Input
                id="lab-report-image"
                ref={ocrFileInput}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => {
                  setOcrFile(event.target.files?.[0] ?? null);
                  setOcrResults([]);
                }}
              />
            </div>
            <Button type="button" disabled={!ocrFile || extracting} onClick={handleExtract}>
              <Upload className="mr-2 h-4 w-4" />
              {extracting ? 'Reading report...' : 'Extract with OCR'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            The image is sent to the configured Azure AI Foundry service for extraction and is not saved by Synora.
            OCR can make mistakes and is not medical advice.
          </p>

          {ocrResults.length > 0 && (
            <div className="space-y-4 border-t pt-4">
              <div>
                <h3 className="font-medium">Review extracted results</h3>
                <p className="text-sm text-muted-foreground">
                  Check every field against your report. Add any missing date or status before saving.
                </p>
              </div>
              <form onSubmit={(event) => {
                event.preventDefault();
                void handleSaveOcrResults();
              }} className="space-y-4">
                <div className="space-y-4">
                  {ocrResults.map((result, index) => (
                    <div key={index} className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label htmlFor={`ocr-parameter-${index}`}>Parameter</Label>
                        <Input id={`ocr-parameter-${index}`} maxLength={120} required value={result.parameter}
                          onChange={(event) => updateOcrResult(index, 'parameter', event.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`ocr-result-${index}`}>Result</Label>
                        <Input id={`ocr-result-${index}`} maxLength={80} required value={result.result}
                          onChange={(event) => updateOcrResult(index, 'result', event.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`ocr-unit-${index}`}>Unit</Label>
                        <Input id={`ocr-unit-${index}`} maxLength={40} value={result.unit}
                          onChange={(event) => updateOcrResult(index, 'unit', event.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`ocr-reference-${index}`}>Reference range</Label>
                        <Input id={`ocr-reference-${index}`} maxLength={120} value={result.reference}
                          onChange={(event) => updateOcrResult(index, 'reference', event.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`ocr-date-${index}`}>Date</Label>
                        <Input id={`ocr-date-${index}`} type="date" required value={result.date}
                          onChange={(event) => updateOcrResult(index, 'date', event.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`ocr-status-${index}`}>Status</Label>
                        <select
                          id={`ocr-status-${index}`}
                          required
                          value={result.status}
                          onChange={(event) => updateOcrResult(index, 'status', event.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="">Select a status</option>
                          <option value="normal">Normal</option>
                          <option value="borderline">Borderline</option>
                          <option value="high">High</option>
                          <option value="low">Low</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
                <Button type="submit" disabled={savingOcrResults}>
                  {savingOcrResults ? 'Saving...' : `Save ${ocrResults.length} reviewed result${ocrResults.length === 1 ? '' : 's'}`}
                </Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>

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
