import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { FeatureFlagsProvider } from "@/contexts/FeatureFlagsContext";
import { NotificationCenter } from "@/components/NotificationCenter";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "R&D Agent - AI-Powered Research Platform",
  description: "Comprehensive literature analysis and team collaboration for research teams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}
      >
        <AuthProvider>
          <FeatureFlagsProvider>
            {children}
            {/* Global Notification Center - positioned fixed */}
            <div className="fixed top-4 right-4 z-50">
              <NotificationCenter />
            </div>
          </FeatureFlagsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
