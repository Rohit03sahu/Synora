'use client';

import { useState } from 'react';
import { Search, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApiData } from '@/hooks/use-api-data';
import type { Patient, RiskLevel } from '@/lib/types';

const riskStyles: Record<RiskLevel, string> = {
  lower: 'bg-success/10 text-success',
  moderate: 'bg-warning/10 text-warning',
  elevated: 'bg-destructive/10 text-destructive',
};

export default function WellnessMembersPage() {
  const [search, setSearch] = useState('');
  const path = `/patients${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''}`;
  const { data: members, error, loading } = useApiData<Patient[]>(path);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Members</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Shared patient records available to your organization.
        </p>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search shared members..."
          aria-label="Search shared members"
          className="pl-10"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
      {error && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Available data</TableHead>
                <TableHead>Latest assessment</TableHead>
                <TableHead>Last updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members?.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>{member.age ?? '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{member.dataAvailable || 'None listed'}</TableCell>
                  <TableCell>
                    {member.assessment ? (
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${riskStyles[member.assessment]}`}>
                        {member.assessment}
                      </span>
                    ) : '—'}
                    {member.lastAssessment && <span className="ml-2 text-xs text-muted-foreground">{member.lastAssessment}</span>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {member.lastUpdated ? new Date(member.lastUpdated).toLocaleDateString() : '—'}
                  </TableCell>
                </TableRow>
              ))}
              {!loading && !members?.length && (
                <TableRow><TableCell colSpan={5} className="py-10 text-center">
                  <Users className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No shared member records found.</p>
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          {loading && <p className="p-4 text-sm text-muted-foreground">Loading members...</p>}
        </CardContent>
      </Card>
    </div>
  );
}
