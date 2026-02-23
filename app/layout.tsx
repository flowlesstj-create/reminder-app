import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reminder App",
  description: "Account-based reminder manager with share links",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
