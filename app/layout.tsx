import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/app/components/Header";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WLA Tournament - ウエイトリフティング大会運営",
  description:
    "IWFルール完全準拠のウエイトリフティング大会運営システム。リアルタイム同期・オフライン対応。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="dark">
      <body
        className={`${inter.variable} font-sans antialiased bg-slate-950 text-slate-100`}
      >
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
