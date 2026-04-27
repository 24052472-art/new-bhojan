import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bhojan - Next-Gen Restaurant OS",
  description: "Unified POS, real-time analytics, and premium QR ordering for modern culinary brands.",
  manifest: "/manifest.json",
  themeColor: "#ff5a2c",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Bhojan OS",
  },
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.variable} ${outfit.variable} min-h-full flex flex-col font-sans selection:bg-primary/20`}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
