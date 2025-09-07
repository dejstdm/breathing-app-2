import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { HeaderProvider } from "@/components/layout/HeaderProvider";
import { ToastProvider } from "@/components/ui/toast";
import { PWAProvider } from "@/components/pwa/PWAProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Breathing App",
  description: "Guided breathing with precise timing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* PWA Theme Colors */}
        <meta name="theme-color" content="#3b82f6" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        
        {/* PWA Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Breathing App" />
        
        {/* PWA Microsoft Tags */}
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Default theme link for no-flash SSR; updated on mount by ThemeProvider */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link id="app-theme" rel="stylesheet" href="/themes/amethyst-haze.css" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <PWAProvider>
          <ThemeProvider>
            <HeaderProvider>
              <ToastProvider>
                <AppShell>{children}</AppShell>
              </ToastProvider>
            </HeaderProvider>
          </ThemeProvider>
        </PWAProvider>
      </body>
    </html>
  );
}
