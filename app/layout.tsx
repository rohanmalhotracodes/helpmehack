import type { Metadata } from "next";
import "./globals.css";
import { AnalyticsProvider } from "@/components/analytics-provider";

export const metadata: Metadata = {
  title: "helpmehack — Open source worth starting",
  description: "Evidence-ranked open-source issues and the contribution details beginners often miss.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1652643971706701"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <AnalyticsProvider />
        {children}
      </body>
    </html>
  );
}
