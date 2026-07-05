import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CryptoNinja AI",
  description: "AI-powered crypto trading platform with subscriptions and paper trading."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
