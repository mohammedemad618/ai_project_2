import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk, Unbounded } from "next/font/google";
import AppShell from "@/components/AppShell";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
});

const unbounded = Unbounded({
  variable: "--font-display",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Project 2 - TSP Optimization Dashboard | TC6544 - Advanced AI",
  description:
    "Project 2 - Interactive workspace for exploring TSP optimization with Simulated Annealing and Harmony Search. TC6544 - Advanced Artificial Intelligence, Universiti Kebangsaan Malaysia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${unbounded.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
