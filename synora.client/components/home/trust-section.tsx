import {
  Eye,
  Database,
  ShieldCheck,
  KeyRound,
  Lock,
  FileCheck,
  History,
  Settings,
  ArrowDown,
} from 'lucide-react';

const trustItems = [
  { icon: Eye, title: 'Explainable AI', desc: 'Every assessment includes transparent reasoning' },
  { icon: Database, title: 'Data Provenance', desc: 'Track where every piece of data comes from' },
  { icon: ShieldCheck, title: 'Data Quality Indicators', desc: 'Visibility into data completeness and reliability' },
  { icon: FileCheck, title: 'User Consent', desc: 'You control what data is collected and processed' },
  { icon: KeyRound, title: 'Role-Based Access', desc: 'Granular permissions for every user type' },
  { icon: Lock, title: 'Secure Authentication', desc: 'Industry-standard security for your health data' },
  { icon: History, title: 'Audit Trail', desc: 'Complete record of data access and changes' },
  { icon: Settings, title: 'Privacy Controls', desc: 'Manage your privacy settings at any time' },
];

const flowSteps = ['Your Data', 'Your Consent', 'Secure Processing', 'AI Analysis', 'Explainable Results'];

export function TrustSection() {
  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {trustItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="rounded-lg border border-border bg-card p-4 transition-all hover:shadow-md hover:border-primary/30">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h4 className="mt-3 text-sm font-semibold">{item.title}</h4>
              <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 rounded-xl border border-border bg-muted/30 p-6">
        {flowSteps.map((step, i) => (
          <div key={step} className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2">
              <span className="text-xs font-bold text-primary">{i + 1}</span>
              <span className="text-sm font-medium">{step}</span>
            </div>
            {i < flowSteps.length - 1 && (
              <ArrowDown className="h-4 w-4 text-muted-foreground rotate-[-90deg]" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
