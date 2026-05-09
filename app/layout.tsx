import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Orchestra - Multi-Agent System',
  description: 'Manage Library, Jobs, Housing, and Grants with an Orchestrator agent.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="font-sans antialiased text-slate-900 bg-slate-50" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
