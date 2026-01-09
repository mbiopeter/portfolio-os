import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import Dock from "@/components/Taskbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "My Portfolio OS",
  description: "A Windows-style portfolio experience",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body   className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black`}>
        {/* Page Content */}
        <Suspense fallback={null}>{children}</Suspense>
        <Dock />
      </body>
    </html>
  );
}
