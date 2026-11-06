import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kilo AI Service",
  description: "A private AI workspace for coding and problem solving.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
