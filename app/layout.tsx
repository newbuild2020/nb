import type { Metadata, Viewport } from "next";
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import "./globals.css";
import ServiceWorkerRegister from './components/ServiceWorkerRegister';

export const metadata: Metadata = {
  title: "NewBuild",
  description: "NewBuild Application",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NewBuild",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1e40af",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={`${GeistSans.className} ${GeistMono.className} antialiased`}>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
