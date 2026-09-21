import type { Metadata } from "next";
import "./globals.css";
import { AnalyticsProvider } from "@/components/analytics-provider";

const siteUrl = "https://www.helpmehack.tech";
const siteName = "HelpMeHack";
const siteDescription =
  "Discover active open-source projects, contribution programs, beginner-friendly issues, and the contribution rules that matter before you start.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "HelpMeHack — Find open source projects worth contributing to",
  description: siteDescription,
  applicationName: siteName,
  authors: [{ name: "HelpMeHack" }],
  creator: "HelpMeHack",
  publisher: "HelpMeHack",
  category: "technology",
  keywords: [
    "open source",
    "open source projects",
    "good first issue",
    "beginner friendly open source",
    "GSoC organizations",
    "Google Summer of Code",
    "Summer of Bitcoin",
    "open source contribution",
    "GitHub issues",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName,
    title: "HelpMeHack — Find open source projects worth contributing to",
    description: siteDescription,
    images: [
      {
        url: "/helpmehack-mark.png",
        alt: "HelpMeHack",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "HelpMeHack — Find open source projects worth contributing to",
    description: siteDescription,
    images: ["/helpmehack-mark.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

const websiteStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteUrl}/#website`,
  url: siteUrl,
  name: siteName,
  description: siteDescription,
};

const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${siteUrl}/#organization`,
  name: siteName,
  url: siteUrl,
  logo: `${siteUrl}/helpmehack-mark.png`,
  sameAs: ["https://github.com/rohanmalhotracodes/helpmehack"],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <meta name="google-adsense-account" content="ca-pub-1652643971706701" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([websiteStructuredData, organizationStructuredData]),
          }}
        />
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
