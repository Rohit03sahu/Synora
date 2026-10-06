'use client';

import { Dna, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const variants = [
  { name: 'TCF7L2', gene: 'rs7903146', risk: 'Moderate', description: 'Associated with Type 2 diabetes risk through impaired insulin secretion.' },
  { name: 'PPARG', gene: 'rs1801282', risk: 'Low', description: 'May influence insulin sensitivity and lipid metabolism.' },
  { name: 'KCNJ11', gene: 'rs5219', risk: 'Moderate', description: 'Involved in pancreatic beta-cell function and insulin regulation.' },
  { name: 'SLC30A8', gene: 'rs13266634', risk: 'Low', description: 'Affects insulin granule maturation in beta cells.' },
];

const snps = [
  { id: 'rs7903146', gene: 'TCF7L2', genotype: 'C/T', significance: 'Heterozygous — moderate risk variant' },
  { id: 'rs1801282', gene: 'PPARG', genotype: 'C/C', significance: 'Wild type — standard risk' },
  { id: 'rs5219', gene: 'KCNJ11', genotype: 'E/K', significance: 'Heterozygous — moderate risk variant' },
  { id: 'rs13266634', gene: 'SLC30A8', genotype: 'R/R', significance: 'Risk allele present' },
];

const riskColors = { Low: 'text-success', Moderate: 'text-warning', High: 'text-destructive' };

export default function GenomicsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Your Genetic Health Context</h1>
        <p className="text-sm text-muted-foreground mt-1">Genomic information as part of your overall assessment</p>
      </div>

      {/* Important note */}
      <div className="flex gap-3 rounded-lg border border-warning/30 bg-warning/5 p-4">
        <AlertCircle className="h-5 w-5 flex-shrink-0 text-warning mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Genomic information is one component of the overall assessment and should be interpreted
          with clinical context. Genetic information can contribute to risk assessment but does not
          independently determine whether someone will develop diabetes.
        </p>
      </div>

      <Tabs defaultValue="variants">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="variants">Genetic Variants</TabsTrigger>
          <TabsTrigger value="snps">SNPs</TabsTrigger>
          <TabsTrigger value="polygenic">Polygenic Risk</TabsTrigger>
        </TabsList>

        <TabsContent value="variants" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {variants.map((variant) => (
              <Card key={variant.name}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Dna className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">{variant.name}</CardTitle>
                        <p className="text-xs text-muted-foreground font-mono">{variant.gene}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold ${riskColors[variant.risk as keyof typeof riskColors]}`}>
                      {variant.risk} Risk
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground leading-relaxed">{variant.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="snps" className="space-y-3 mt-4">
          {snps.map((snp) => (
            <Card key={snp.id}>
              <CardContent className="pt-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="rounded-md bg-muted px-2 py-1 text-xs font-mono font-medium">{snp.id}</span>
                    <div>
                      <p className="text-sm font-semibold">{snp.gene}</p>
                      <p className="text-xs text-muted-foreground">{snp.significance}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Genotype:</span>
                    <span className="rounded-md border border-border bg-card px-2.5 py-1 text-sm font-mono font-semibold">{snp.genotype}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="polygenic" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Polygenic Risk Score</CardTitle>
              <CardDescription>Combined genetic risk based on multiple variants</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Your Score</p>
                  <p className="text-3xl font-bold text-warning mt-1">0.62</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Percentile</p>
                  <p className="text-3xl font-bold mt-1">62nd</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Risk Spectrum</span>
                  <span className="text-warning font-medium">Moderate Genetic Risk</span>
                </div>
                <div className="relative h-3 rounded-full bg-gradient-to-r from-success via-warning to-destructive">
                  <div className="absolute top-1/2 h-5 w-5 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-background bg-foreground shadow-md" style={{ left: '62%' }} />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Low</span>
                  <span>Moderate</span>
                  <span>High</span>
                </div>
              </div>
              <div className="rounded-lg bg-muted/40 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  <p className="text-xs font-semibold">What this means</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your polygenic risk score indicates a moderate genetic predisposition. This is
                  combined with clinical, lifestyle, and glucose data by Synora Intelligence to produce
                  your overall assessment. It does not mean you will develop diabetes.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Family History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Father — Type 2 Diabetes</span>
                <span className="flex items-center gap-1 text-xs text-warning"><AlertCircle className="h-3 w-3" /> Confirmed</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Grandmother (paternal) — Type 2 Diabetes</span>
                <span className="flex items-center gap-1 text-xs text-warning"><AlertCircle className="h-3 w-3" /> Confirmed</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Mother — No history</span>
                <span className="flex items-center gap-1 text-xs text-success"><CheckCircle2 className="h-3 w-3" /> None reported</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Genetic Data Quality</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Variant coverage</span>
                  <span className="font-medium">85%</span>
                </div>
                <Progress value={85} className="h-1.5" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">SNP call rate</span>
                  <span className="font-medium">92%</span>
                </div>
                <Progress value={92} className="h-1.5" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Data completeness</span>
                  <span className="font-medium">40%</span>
                </div>
                <Progress value={40} className="h-1.5" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
