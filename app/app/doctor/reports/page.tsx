'use client';

import { FileText, Download, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const reports = [
  { id: 'GG-2026-0920-SJ', patient: 'Sarah Johnson', date: 'Sep 20, 2026', risk: 'Elevated' },
  { id: 'GG-2026-0918-MC', patient: 'Michael Chen', date: 'Sep 18, 2026', risk: 'Moderate' },
  { id: 'GG-2026-0922-ED', patient: 'Emily Davis', date: 'Sep 22, 2026', risk: 'Lower' },
  { id: 'GG-2026-0910-RW', patient: 'Robert Wilson', date: 'Sep 10, 2026', risk: 'Elevated' },
  { id: 'GG-2026-0919-LM', patient: 'Linda Martinez', date: 'Sep 19, 2026', risk: 'Moderate' },
];

export default function DoctorReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">Patient health intelligence reports</p>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-sm">{r.id}</TableCell>
                  <TableCell className="text-sm font-medium">{r.patient}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.date}</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      r.risk === 'Lower' ? 'text-success bg-success/10' :
                      r.risk === 'Moderate' ? 'text-warning bg-warning/10' : 'text-destructive bg-destructive/10'
                    }`}>{r.risk}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm"><Eye className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm"><Download className="h-3.5 w-3.5" /></Button>
                    </div>
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
