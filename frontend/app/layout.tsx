

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

// Font configuration
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});


export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#3b82f6',
};


export const metadata: Metadata = {
  title: 'SIAKAD STT Diakonos',
  description: 'Sistem Informasi Akademik Sekolah Tinggi Teologi Diakonos Banyumas',
  keywords: ['SIAKAD', 'STT Diakonos', 'Akademik', 'KRS', 'KHS', 'Banyumas', 'Teologi'],
  authors: [{ name: 'Angello Khara Sitanggang' }],
  

  icons: {
    icon: [
      { url: '/favicon/favicon.ico' },
      { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/favicon/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'android-chrome', url: '/favicon/android-chrome-192x192.png', sizes: '192x192' },
      { rel: 'android-chrome', url: '/favicon/android-chrome-512x512.png', sizes: '512x512' },
    ],
  },
  

  manifest: '/site.webmanifest',
  

  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://siakad.sttdiakonos.ac.id'),
  

  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SIAKAD STT Diakonos',
  },
  

  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://siakad.sttdiakonos.ac.id',
    siteName: 'SIAKAD STT Diakonos',
    title: 'SIAKAD STT Diakonos',
    description: 'Sistem Informasi Akademik Sekolah Tinggi Teologi Diakonos Banyumas',
    images: [
      {
        url: '/LOGO.png',
        width: 512,
        height: 512,
        alt: 'STT Diakonos Logo',
      },
    ],
  },
  

  twitter: {
    card: 'summary',
    title: 'SIAKAD STT Diakonos',
    description: 'Sistem Informasi Akademik Sekolah Tinggi Teologi Diakonos Banyumas',
    images: ['/LOGO.png'],
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