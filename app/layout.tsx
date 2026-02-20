import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: 'swap', // Optimize font loading
});

export const metadata: Metadata = {
  title: "site(.)moss",
  description: "Windows 8 Metro UI Style with Pastel Aesthetic",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F2EBE3" },
    { media: "(prefers-color-scheme: dark)", color: "#1A1410" }
  ],
};

import Background from "@/components/Background";
import ThemeToggle from "@/components/ThemeToggle";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body
        className={`${dmSans.variable} font-sans antialiased`}
      >
        <ThemeProvider>
          <Background />
          <ThemeToggle />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
