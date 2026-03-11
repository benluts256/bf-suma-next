// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS v6.0 — ROOT LAYOUT
// File: app/layout.tsx
// ═══════════════════════════════════════════════════════════════════════════════

import type { Metadata, Viewport } from "next";
import { Inter, Outfit, DM_Serif_Display, JetBrains_Mono } from "next/font/google";
import { NexusProvider } from "@/components/nexusplatform";
import { NativeStatusBar } from "@/components/native-status-bar";
import { ServiceWorkerRegister } from "@/components/sw-register";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const dmSerif = DM_Serif_Display({ weight: ["400"], subsets: ["latin"], variable: "--font-dm-serif" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://bf-suma-nexus.vercel.app'),
  title: {
    default: 'BF Suma Nexus',
    template: '%s | BF Suma Nexus',
  },
  description: 'Your all-in-one platform for managing your wellness journey with BF Suma premium supplements.',
  keywords: ['supplements', 'wellness', 'health', 'Uganda', 'nutrition', 'distributor'],
  authors: [{ name: 'BF Suma Nexus' }],
  creator: 'BF Suma',
  publisher: 'BF Suma',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BF Suma Nexus',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  openGraph: {
    type: 'website',
    locale: 'en_UG',
    url: 'https://bf-suma-nexus.vercel.app',
    siteName: 'BF Suma Nexus',
    title: 'BF Suma Nexus',
    description: "Uganda's premier supplement distribution and wellness platform",
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'BF Suma Nexus',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BF Suma Nexus',
    description: "Uganda's premier supplement distribution and wellness platform",
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#228B22',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} ${dmSerif.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <NativeStatusBar />
        <ServiceWorkerRegister />
        <NexusProvider>
          {children}
        </NexusProvider>
      </body>
    </html>
  );
}
