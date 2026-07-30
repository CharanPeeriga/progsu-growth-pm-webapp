import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "growth-pm-bot Dashboard",
  description: "Admin Dashboard for growth-pm-bot",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} dark`}
    >
      <body className="min-h-screen bg-base text-primary font-body antialiased">
        <div aria-hidden className="bg-layer-halo" />
        <div aria-hidden className="bg-layer-grid" />
        <div aria-hidden className="bg-layer-grain" />
        {children}
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
