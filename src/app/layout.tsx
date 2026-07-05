import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Cyber Recon Portal & Operations Dashboard",
  description: "Advanced cybersecurity threat hunting, network mapping, active lookup, and CVE vulnerability scanning engine.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased min-h-screen text-slate-100 bg-[#080C14] overflow-x-hidden`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
