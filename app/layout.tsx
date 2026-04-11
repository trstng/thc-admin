import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tidy Home Co. — Admin",
  description: "Operations dashboard for Tidy Home Co.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: "14px",
              border: "1px solid rgba(15, 23, 42, 0.08)",
              background: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "saturate(180%) blur(20px)",
              fontFamily: "var(--font-inter)",
              fontSize: "0.875rem",
            },
          }}
        />
      </body>
    </html>
  );
}
