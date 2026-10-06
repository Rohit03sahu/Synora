import Link from 'next/link';
import { SynoraHealthLogo } from './logo';

const footerSections = [
  {
    title: 'Platform',
    links: [
      { label: 'Patients', href: '/solutions#patients' },
      { label: 'Doctors', href: '/solutions#doctors' },
      { label: 'Hospitals', href: '/solutions#hospitals' },
      { label: 'Wellness', href: '/solutions#wellness' },
    ],
  },
  {
    title: 'Technology',
    links: [
      { label: 'CGM', href: '/technology#cgm' },
      { label: 'Genomics', href: '/technology#genomics' },
      { label: 'AI/ML', href: '/technology' },
      { label: 'Explainable AI', href: '/how-it-works' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Research', href: '/about' },
      { label: 'Contact', href: '/about' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Medical Disclaimer', href: '/medical-disclaimer' },
      { label: 'Security', href: '/about#trust' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <SynoraHealthLogo />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground leading-relaxed">
              AI Diabetes &amp; Metabolic Health Intelligence. Connecting the signals behind
              diabetes risk.
            </p>
            <p className="mt-3 text-xs font-medium text-muted-foreground">
              Powered by Synora Intelligence&trade;
            </p>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-semibold text-foreground">{section.title}</h4>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; 2026 Synora Health. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            GenoGluco is not a medical device. AI results are not a medical diagnosis.
          </p>
        </div>
      </div>
    </footer>
  );
}
