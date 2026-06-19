import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EXPLORE.AH! Dashboard - Data Mining Kejahatan LA",
  description: "Dashboard interaktif visualisasi analisis data mining kejahatan Los Angeles (2020-2024) untuk kompetisi EXPLORE.AH! UNESA 2026.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
