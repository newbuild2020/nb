import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import "./globals.css";
import Script from 'next/script';

export const metadata: Metadata = {
  title: "NewBuild",
  description: "NewBuild Application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        <Script src="/libs/jspdf.umd.min.js" strategy="beforeInteractive" />
        <Script src="/fonts/NotoSansJP-Regular.js" strategy="beforeInteractive" />
      </head>
      <body className={`${GeistSans.className} ${GeistMono.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
