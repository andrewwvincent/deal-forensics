import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Deal Forensics Analytics Dashboard',
  description: 'Decision analytics dashboard for deal forensics analysis',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <div className="min-h-screen flex flex-col">
          <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <h1 className="text-2xl font-bold text-gray-900">Deal Forensics Analytics Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Decision insights across 1,193 decisions spanning 10 consolidated decision types
              </p>
            </div>
          </nav>
          <main className="flex-1">{children}</main>
          <footer className="bg-white border-t border-gray-200 mt-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-sm text-gray-600">
              <p>Data sourced from deal_forensics Supabase table | Last updated May 8, 2026</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
