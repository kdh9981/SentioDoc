import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "LinkLens - Share anything. See everything.",
  description: "Track who views your documents, videos, or any link. Know who's serious with branded links and real-time analytics.",
  keywords: ["link tracking", "document sharing", "analytics", "branded links", "viewer tracking"],
  openGraph: {
    title: "LinkLens - Share anything. See everything.",
    description: "Track who views your documents, videos, or any link. Know who's serious with branded links and real-time analytics.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
