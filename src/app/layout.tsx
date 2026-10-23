import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://poop.lol'),
  title: 'poop.lol - Who Poops The Most?',
  description:
    'Compite con tus amigos, compañeros de trabajo o clase en salas privadas y descubre quién va más al baño. Ranking solo por salas.',
  applicationName: 'poop.lol',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon.ico' }
    ],
    apple: [{ url: '/apple-touch-icon.png' }]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'poop.lol'
  },
  openGraph: {
    title: 'poop.lol - Who Poops The Most?',
    description: 'Salas privadas, ranking por sala y notificaciones cuando te quitan el trono.',
    type: 'website',
    images: ['/popohero1_transparent.png']
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/popohero1_transparent.png']
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#f59e0b'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {process.env.NODE_ENV !== 'production' && (
          <Script
            id="dev-sw-cleanup"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(){if(!('serviceWorker' in navigator))return;var key='poop-sw-dev-cleanup';navigator.serviceWorker.getRegistrations().then(function(regs){if(!regs.length)return;Promise.all(regs.map(function(reg){return reg.unregister();})).then(function(){var clear='caches' in window?caches.keys().then(function(keys){return Promise.all(keys.map(function(name){return caches.delete(name);}));}):Promise.resolve();clear.then(function(){if(sessionStorage.getItem(key)!=='done'){sessionStorage.setItem(key,'done');window.location.reload();}});});});})();`
            }}
          />
        )}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-white text-neutral-900 antialiased font-sans selection:bg-amber-100 selection:text-amber-900">
        <ThemeProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
