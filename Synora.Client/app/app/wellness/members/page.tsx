'use client';

import { Search, Filter, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const members = Array.from({ length: 8 }, (_, i) => ({
  id: `WM-${2000 + i}`,
  name: ['Alex Brown', 'Jordan Lee', 'Taylor Reed', 'Casey Ward', 'Riley Fox', 'Morgan Hill', 'Quinn Nash', 'Avery Stone'][i],
  joined: `2026-0${i + 1}-15`,
  surveys: Math.round(Math.random() * 5 + 1),
  status: i % 3 === 0 ? 'Active' : i % 3 === 1 ? 'Pending' : 'Inactive',
}));

export default function WellnessMembersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Members</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your wellness organization members</p>
      </div>
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search members..." className="pl-10" />
        </div>
        <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Surveys</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-sm">{m.id}</TableCell>
                  <TableCell className="text-sm font-medium">{m.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.joined}</TableCell>
                  <TableCell className="text-sm">{m.surveys}</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      m.status === 'Active' ? 'text-success bg-success/10' :
                      m.status === 'Pending' ? 'text-warning bg-warning/10' : 'text-muted-foreground bg-muted'
                    }`}>{m.status}</span>
                  </TableCell>
                  <TableCell><Button variant="ghost" size="sm"><Eye className="h-3.5 w-3.5 mr-1" />View</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
