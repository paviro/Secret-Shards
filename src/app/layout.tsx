import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AnimatedBackgroundProvider } from "@/context/AnimatedBackgroundContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Secret Shards",
  description: "Securely split your secrets using Shamir's Secret Sharing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* 
          CSP for Static Export:
          - default-src 'self': Only load resources from same origin
          - script-src 'self' 'unsafe-inline': Next.js requires 'unsafe-inline' for hydration scripts in static exports. 
          - style-src 'self' 'unsafe-inline': Required for Tailwind/CSS-in-JS
          - img-src 'self' blob: data: : Required for QR codes and PDF generation
          - worker-src 'self' blob: : Required for PDF generation workers
        */}
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self' data:; worker-src 'self' blob:; connect-src 'self' blob: data:; object-src 'none'; base-uri 'self'; form-action 'self';"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AnimatedBackgroundProvider>
          {children}
        </AnimatedBackgroundProvider>
      </body>
    </html>
  );
}
