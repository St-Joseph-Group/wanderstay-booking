import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Toaster } from "@/components/ui/toaster";
import { CurrencyProvider } from "@/lib/currency";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Lora — a warm, humanist serif with moderate contrast. Gentle and readable
// (not the high-contrast, harsh feel of Fraunces). Includes italic for accents.
const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Wanderstay — Book unique places to stay",
  description:
    "Find and book apartments, villas, cabins and more from hosts around the world.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${lora.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        <CurrencyProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster />
        </CurrencyProvider>
      </body>
    </html>
  );
}
