/**
 * Root Layout - Global Layout untuk semua pages
 * Providers: QueryClientProvider, Toaster
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

// Font configuration
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

// Metadata
export const metadata: Metadata = {
  title: 'SIAKAD STT Diakonos',
  description: 'Sistem Informasi Akademik Sekolah Tinggi Teologi Diakonos Banyumas',
  keywords: ['SIAKAD', 'STT Diakonos', 'Akademik', 'KRS', 'KHS'],
  authors: [{ name: 'Angello Khara Sitanggang' }],
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}