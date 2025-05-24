import type { Metadata } from "next";
import config from "@/config";
import localFont from "next/font/local";
import "./globals.css";
import { getLocale } from "next-intl/server";
import ClientLayout from "../components/layout-client";
import ToltScript from "../components/ToltScript";

export const viewport = {
  // Will use the primary color of your theme to show a nice theme color in the URL bar of supported browsers
  themeColor: config.colors.main,
  width: "device-width",
  initialScale: 1,
};

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Hoox",
  description: "Hoox application",
  robots: "noindex, nofollow",
};

export default async function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {

  const locale = await getLocale();

  return (
    <html lang={locale} data-theme={config.colors.theme} >
      <head>
        <ToltScript />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
