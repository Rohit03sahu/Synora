'use client';

import { Users, Search, Filter, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockPatients } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const riskConfig = {
  lower: 'text-success bg-success/10',
  moderate: 'text-warning bg-warning/10',
  elevated: 'text-destructive bg-destructive/10',
};

export default function HospitalPatientsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Patient Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Population-level patient overview</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by patient ID or name..." className="pl-10" />
        </div>
        <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient ID</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Last Assessment</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPatients.map((p, i) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-sm">PT-{1000 + i}</TableCell>
                  <TableCell className="text-sm">{['Endocrinology', 'Internal Medicine', 'Cardiology'][i % 3]}</TableCell>
                  <TableCell className="text-sm">{['Dr. Smith', 'Dr. Lee', 'Dr. Patel'][i % 3]}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.lastAssessment}</TableCell>
                  <TableCell>
                    <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium capitalize', riskConfig[p.assessment])}>
                      {p.assessment}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm"><Eye className="h-3.5 w-3.5 mr-1" />View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
