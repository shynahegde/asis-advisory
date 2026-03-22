import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "TechRescue — Tech Support You Can Trust",
  description:
    "Fast, friendly tech support for homes and small businesses. Submit your issue and get help within minutes.",
  keywords: ["tech support", "computer help", "IT support", "home tech"],
  openGraph: {
    title: "TechRescue — Tech Support You Can Trust",
    description: "Fast, friendly tech support for homes and small businesses.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head />
      <body className="bg-white text-gray-900 antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
