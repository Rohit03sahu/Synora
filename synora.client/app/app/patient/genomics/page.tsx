'use client';

import { AlertCircle, Dna, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApiData } from '@/hooks/use-api-data';

interface GenomicVariant {
  id: string;
  gene: string;
  variantId: string;
  genotype: string;
  riskLevel: 'low' | 'moderate' | 'high';
  description: string;
}

interface OnboardingData {
  familyHistory: {
    hasFamilyHistory?: string;
    members?: string[];
    otherHistory?: string;
  };
}

const riskColors = {
  low: 'text-success',
  moderate: 'text-warning',
  high: 'text-destructive',
};

export default function GenomicsPage() {
  const { data: variants, error: variantsError, loading } = useApiData<GenomicVariant[]>('/genomics');
  const { data: onboarding } = useApiData<OnboardingData>('/onboarding');
  const familyHistory = onboarding?.familyHistory;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Your Genetic Health Context</h1>
        <p className="text-sm text-muted-foreground mt-1">Genomic information as part of your overall assessment</p>
      </div>

      <div className="flex gap-3 rounded-lg border border-warning/30 bg-warning/5 p-4">
        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          Genomic information is one component of the overall assessment and should be interpreted
          with clinical context. Genetic information can contribute to risk assessment but does not
          independently determine whether someone will develop diabetes.
        </p>
      </div>

      {variantsError && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {variantsError}
        </div>
      )}

      <Tabs defaultValue="variants">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="variants">Genetic Variants</TabsTrigger>
          <TabsTrigger value="snps">SNPs</TabsTrigger>
          <TabsTrigger value="polygenic">Polygenic Risk</TabsTrigger>
        </TabsList>

        <TabsContent value="variants" className="mt-4 space-y-4">
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading genomic results...</p>
          ) : variants?.length ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {variants.map((variant) => (
                <Card key={variant.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Dna className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-sm">{variant.gene}</CardTitle>
                          <p className="font-mono text-xs text-muted-foreground">{variant.variantId}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-semibold capitalize ${riskColors[variant.riskLevel]}`}>
                        {variant.riskLevel} risk
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs leading-relaxed text-muted-foreground">{variant.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              No genomic variants have been added to your health record.
            </p>
          )}
        </TabsContent>

        <TabsContent value="snps" className="mt-4 space-y-3">
          {variants?.length ? variants.map((variant) => (
            <Card key={variant.id}>
              <CardContent className="pt-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs font-medium">{variant.variantId}</span>
                    <div>
                      <p className="text-sm font-semibold">{variant.gene}</p>
                      <p className="text-xs capitalize text-muted-foreground">{variant.riskLevel} reported risk category</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Genotype:</span>
                    <span className="rounded-md border border-border bg-card px-2.5 py-1 font-mono text-sm font-semibold">{variant.genotype}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )) : (
            <p className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              SNP results will appear here when genomic data is available.
            </p>
          )}
        </TabsContent>

        <TabsContent value="polygenic" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Polygenic Risk Score</CardTitle>
              <CardDescription>Combined genetic risk requires a validated, clinically reviewed analysis</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3 rounded-lg bg-muted/40 p-4">
              <Info className="h-4 w-4 flex-shrink-0 text-primary" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                No reviewed polygenic risk score is available in your record. Individual variants alone
                do not determine your risk of developing diabetes.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Family History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {familyHistory?.members?.length ? (
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {familyHistory.members.map((member) => <li key={member}>{member}</li>)}
                </ul>
              ) : familyHistory?.otherHistory ? (
                <p className="text-sm text-muted-foreground">{familyHistory.otherHistory}</p>
              ) : familyHistory?.hasFamilyHistory === 'no' ? (
                <p className="text-sm text-muted-foreground">No family history reported in onboarding.</p>
              ) : (
                <p className="text-sm text-muted-foreground">No family history information has been recorded.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
