import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kilo AI Service",
  description: "AI coding agent service built on modern Next.js and provider abstractions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
