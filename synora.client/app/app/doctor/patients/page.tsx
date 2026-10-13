'use client';

import { useState } from 'react';
import { Search, Filter, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useApiData } from '@/hooks/use-api-data';
import type { Patient } from '@/lib/types';

const riskConfig = {
  lower: { label: 'Lower', color: 'text-success bg-success/10' },
  moderate: { label: 'Moderate', color: 'text-warning bg-warning/10' },
  elevated: { label: 'Elevated', color: 'text-destructive bg-destructive/10' },
};

export default function DoctorPatientsPage() {
  const [search, setSearch] = useState('');
  const { data: patients, error, loading } = useApiData<Patient[]>(
    `/patients${search ? `?search=${encodeURIComponent(search)}` : ''}`,
  );

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
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

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
                <TableRow key={patient.id} className="cursor-pointer hover:bg-muted/30">
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
                    <Button variant="ghost" size="sm">
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
    </div>
  );
}
