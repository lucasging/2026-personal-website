import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CustomCursor } from "./components/CustomCursor";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lucas Gingera",
  description: "Personal website of Lucas Gingera, a Product Manager & Software Engineer",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `@media (hover: hover) and (pointer: fine) { html, body, body * { cursor: none !important; } }`,
          }}
        />
        <CustomCursor />
        {children}
      </body>
    </html>
  );
}
