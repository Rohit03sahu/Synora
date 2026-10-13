const diabetesTypes = [
  {
    title: 'Type 1 Diabetes',
    summary: 'An autoimmune condition where the body stops making enough insulin.',
    points: ['Often starts in childhood or adolescence', 'Requires lifelong insulin therapy', 'Early detection supports better management'],
  },
  {
    title: 'Type 2 Diabetes',
    summary: 'The body becomes less effective at using insulin and may gradually produce less over time.',
    points: ['Commonly linked to lifestyle and weight factors', 'Often develops gradually', 'Can be delayed or managed with lifestyle and clinical support'],
  },
  {
    title: 'Gestational Diabetes',
    summary: 'High blood sugar that develops during pregnancy and typically resolves after birth.',
    points: ['Can affect pregnancy health', 'May increase future diabetes risk', 'Monitoring and management are important during pregnancy'],
  },
];

export function DiabetesTypes() {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {diabetesTypes.map((type) => (
        <div key={type.title} className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 inline-flex rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
            Diabetes
          </div>
          <h3 className="text-xl font-semibold text-foreground">{type.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{type.summary}</p>
          <ul className="mt-4 space-y-2 text-sm text-foreground/80">
            {type.points.map((point) => (
              <li key={point} className="flex gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
