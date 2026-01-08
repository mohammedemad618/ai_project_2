import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  IBM_Plex_Mono,
  Source_Serif_4,
} from "next/font/google";
import AppShell from "@/components/AppShell";
import "./globals.css";

const sourceSerif = Source_Serif_4({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
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
        className={`${sourceSerif.variable} ${cormorant.variable} ${plexMono.variable} antialiased`}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
