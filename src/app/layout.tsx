import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const defaultFont = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Team Checkmate",
  description: "Checkmate CS2 Panel - Powered by Community",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${defaultFont.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
