'use client';

import { useState } from 'react';
import { Search, Filter, Eye, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useApiData } from '@/hooks/use-api-data';
import { apiGet } from '@/lib/api-client';
import { useEffect } from 'react';
import { toast } from 'sonner';
import type { Patient, RiskLevel, LabResult } from '@/lib/types';

const riskConfig: Record<RiskLevel, { label: string; color: string }> = {
  lower: { label: 'Lower', color: 'text-success bg-success/10' },
  moderate: { label: 'Moderate', color: 'text-warning bg-warning/10' },
  elevated: { label: 'Elevated', color: 'text-destructive bg-destructive/10' },
};

const riskFilterOptions: { value: string; label: string }[] = [
  { value: 'lower', label: 'Lower Risk' },
  { value: 'moderate', label: 'Moderate Risk' },
  { value: 'elevated', label: 'Elevated Risk' },
];

interface PatientDetail {
  profile: { id: string; fullName: string; email: string; phone: string | null };
  labs: LabResult[];
  assessment: { riskLevel: RiskLevel; summary: string; assessedAt: string; score: number | null } | null;
}

export default function DoctorPatientsPage() {
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [detail, setDetail] = useState<PatientDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const queryParams = new URLSearchParams();
  if (search) queryParams.set('search', search);
  if (riskFilter) queryParams.set('risk', riskFilter);
  const queryString = queryParams.toString();

  const { data: patients, error, loading } = useApiData<Patient[]>(
    `/patients${queryString ? `?${queryString}` : ''}`,
  );

  const loadPatientDetail = async (patient: Patient) => {
    setSelectedPatient(patient);
    setDetail(null);
    setDetailLoading(true);
    try {
      const data = await apiGet<PatientDetail>(`/patients/${patient.id}`);
      setDetail(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load patient details.';
      toast.error(message);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Patients</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage and view your patients</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search patients..." className="pl-10" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <Button variant={showFilters ? 'default' : 'outline'} size="icon" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-card p-4">
          <span className="text-xs font-medium text-muted-foreground self-center">Risk level:</span>
          <Button variant={riskFilter === '' ? 'default' : 'outline'} size="sm" onClick={() => setRiskFilter('')}>All</Button>
          {riskFilterOptions.map((opt) => (
            <Button key={opt.value} variant={riskFilter === opt.value ? 'default' : 'outline'} size="sm" onClick={() => setRiskFilter(opt.value)}>
              {opt.label}
            </Button>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Last Assessment</TableHead>
                <TableHead>Data Available</TableHead>
                <TableHead>Assessment</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(patients ?? []).map((patient) => (
                <TableRow key={patient.id} className="cursor-pointer hover:bg-muted/30" onClick={() => loadPatientDetail(patient)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {patient.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-sm font-medium">{patient.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{patient.age ?? '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {patient.lastAssessment ? new Date(`${patient.lastAssessment}T00:00:00`).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{patient.dataAvailable}</TableCell>
                  <TableCell>
                    {patient.assessment ? (
                      <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium capitalize', riskConfig[patient.assessment].color)}>
                        {riskConfig[patient.assessment].label}
                      </span>
                    ) : <span className="text-xs text-muted-foreground">Not assessed</span>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {patient.lastUpdated ? new Date(patient.lastUpdated).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); loadPatientDetail(patient); }}>
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && !error && !patients?.length && (
                <TableRow><TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  No patients are available to your care team.
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground">Loading patients...</p>}

      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedPatient(null)} />
          <Card className="relative z-10 max-h-[85vh] w-full max-w-2xl overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">{selectedPatient.name}</CardTitle>
                <CardDescription>Patient details and health record</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedPatient(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {detailLoading && <p className="text-sm text-muted-foreground">Loading patient details...</p>}
              {detail && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium">{detail.profile.email}</p>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium">{detail.profile.phone ?? '—'}</p>
                    </div>
                  </div>

                  {detail.assessment && (
                    <div className="rounded-lg border border-border p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">Latest Assessment</span>
                        <span className={cn('rounded-full px-3 py-1 text-xs font-semibold capitalize', riskConfig[detail.assessment.riskLevel].color)}>
                          {detail.assessment.riskLevel} risk
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{detail.assessment.summary}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Assessed: {new Date(detail.assessment.assessedAt).toLocaleDateString()} · Score: {detail.assessment.score ?? 'N/A'}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-semibold mb-2">Lab Results</p>
                    {detail.labs.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No lab results recorded.</p>
                    ) : (
                      <div className="rounded-lg border border-border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Parameter</TableHead>
                              <TableHead className="text-xs">Result</TableHead>
                              <TableHead className="text-xs">Date</TableHead>
                              <TableHead className="text-xs">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {detail.labs.map((lab) => (
                              <TableRow key={lab.id}>
                                <TableCell className="text-xs font-medium">{lab.parameter}</TableCell>
                                <TableCell className="text-xs">{lab.result} {lab.unit}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{lab.date}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs capitalize">{lab.status}</Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </>
              )}
              {!detailLoading && !detail && (
                <p className="text-sm text-muted-foreground">Could not load patient details.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
