import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  title: 'Synora Health — GenoGluco | AI Diabetes & Metabolic Health Intelligence',
  description:
    'GenoGluco by Synora Health brings together clinical, glucose, genomic, and lifestyle data through Synora Intelligence™ to create personalized, explainable diabetes risk insights.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
