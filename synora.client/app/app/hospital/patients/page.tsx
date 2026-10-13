'use client';

import { useState } from 'react';
import { Users, Search, Filter, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useApiData } from '@/hooks/use-api-data';
import type { Patient } from '@/lib/types';

const riskConfig = {
  lower: 'text-success bg-success/10',
  moderate: 'text-warning bg-warning/10',
  elevated: 'text-destructive bg-destructive/10',
};

export default function HospitalPatientsPage() {
  const [search, setSearch] = useState('');
  const { data: patients, error, loading } = useApiData<Patient[]>(
    `/patients${search ? `?search=${encodeURIComponent(search)}` : ''}`,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Patient Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Population-level patient overview</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by patient ID or name..." className="pl-10" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Data Available</TableHead>
                <TableHead>Last Assessment</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(patients ?? []).map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-sm font-medium">{p.name}</TableCell>
                  <TableCell className="text-sm">{p.age ?? '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.dataAvailable}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.lastAssessment ? new Date(`${p.lastAssessment}T00:00:00`).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell>
                    {p.assessment ? (
                      <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium capitalize', riskConfig[p.assessment])}>
                        {p.assessment}
                      </span>
                    ) : <span className="text-xs text-muted-foreground">Not assessed</span>}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm"><Eye className="h-3.5 w-3.5 mr-1" />View</Button>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && !error && !patients?.length && (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  No patients are available to your organization.
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
