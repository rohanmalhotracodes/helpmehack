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
      <body>
        <AnalyticsProvider />
        {children}
      </body>
    </html>
  );
}
