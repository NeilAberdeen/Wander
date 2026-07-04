import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wander — Swipe for the feeling",
  description: "Swipe for the feeling. Chat to refine it. Book a real trip.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#05070D",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg text-white font-sans antialiased">
        <div className="mx-auto flex h-[100dvh] max-w-[480px] flex-col overflow-hidden bg-bg">
          {children}
        </div>
      </body>
    </html>
  );
}
