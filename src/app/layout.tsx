import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/providers/auth-provider';
import './globals.css';
import type { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: 'HatodJasaan - Ihatod sa imong pultahan!',
    template: '%s | HatodJasaan',
  },
  description:
    'Local food & goods delivery platform for Jasaan, Misamis Oriental. Order from your favorite karinderya, lechon manok, bakery, and more — delivered by local riders at the lowest fees.',
  keywords: ['Jasaan', 'delivery', 'food delivery', 'karinderya', 'Misamis Oriental', 'hatod'],
  openGraph: {
    title: 'HatodJasaan',
    description: 'Local delivery platform for Jasaan residents',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-slate-50 font-sans">
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '12px',
                background: '#1e293b',
                color: '#f8fafc',
                fontSize: '14px',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
