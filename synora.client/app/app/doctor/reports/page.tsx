'use client';

import { FileText, Eye, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApiData } from '@/hooks/use-api-data';
import type { Patient, RiskLevel } from '@/lib/types';
import { cn } from '@/lib/utils';

interface AssessmentRecord {
  id: string;
  assessedAt: string;
  riskLevel: RiskLevel;
  score: number | null;
  modelVersion: string;
  summary: string;
}

const riskConfig: Record<RiskLevel, { label: string; color: string }> = {
  lower: { label: 'Lower', color: 'text-success bg-success/10' },
  moderate: { label: 'Moderate', color: 'text-warning bg-warning/10' },
  elevated: { label: 'Elevated', color: 'text-destructive bg-destructive/10' },
};

export default function DoctorReportsPage() {
  const { data: overview, error, loading } = useApiData<{ patients: Patient[] }>('/dashboard/overview');
  const patients = overview?.patients ?? [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">Patient health overview and assessment records</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Patient Reports</CardTitle>
          <CardDescription>Summary of patients and their latest assessment status</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Last Assessment</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Data Available</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="text-sm font-medium">{patient.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {patient.lastAssessment ? new Date(`${patient.lastAssessment}T00:00:00`).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell>
                    {patient.assessment ? (
                      <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', riskConfig[patient.assessment].color)}>
                        {riskConfig[patient.assessment].label}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not assessed</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{patient.dataAvailable}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {patient.lastUpdated ? new Date(patient.lastUpdated).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={handlePrint}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handlePrint}>
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && !error && patients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    No patient reports are available.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {loading && <p className="p-4 text-sm text-muted-foreground">Loading reports...</p>}
        </CardContent>
      </Card>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
