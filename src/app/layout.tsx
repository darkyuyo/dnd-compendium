import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "D&D Compendium",
  description: "Private D&D reference for your table",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
