const riskFactors = [
  {
    category: 'Biological',
    value: 'Age, family history, and weight',
    description: 'Some risk factors are built into a person’s health profile and may increase susceptibility over time.',
  },
  {
    category: 'Lifestyle',
    value: 'Activity, sleep, and nutrition',
    description: 'Daily patterns and habits can influence insulin sensitivity and metabolic health.',
  },
  {
    category: 'Clinical',
    value: 'Blood pressure, cholesterol, and prior labs',
    description: 'Clinical markers help clinicians understand risk in context rather than in isolation.',
  },
  {
    category: 'Environment',
    value: 'Stress, access, and social context',
    description: 'The broader environment can shape health outcomes and make risk more complex to interpret.',
  },
];

export function RiskFactorVisualization() {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {riskFactors.map((factor) => (
        <div
          key={factor.category}
          className="rounded-xl border border-border bg-gradient-to-b from-card to-muted/20 p-5 shadow-sm"
        >
          <div className="mb-3 inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
            {factor.category}
          </div>
          <h3 className="text-base font-semibold text-foreground">{factor.value}</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{factor.description}</p>
        </div>
      ))}
    </div>
  );
}
