import type { Metadata } from "next";
import "./globals.css";
import { AnalyticsProvider } from "@/components/analytics-provider";

const siteUrl = "https://www.helpmehack.tech";
const siteName = "helpmehack";
const siteDescription =
  "Discover active open-source projects, contribution programs, beginner-friendly issues, and the contribution rules that matter before you start.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "helpmehack — Find open source projects worth contributing to",
  description: siteDescription,
  applicationName: siteName,
  authors: [{ name: "helpmehack" }],
  creator: "helpmehack",
  publisher: "helpmehack",
  category: "technology",
  icons: {
    icon: [
      {
        url: "/helpmehack-favicon.svg",
        type: "image/svg+xml",
      },
      {
        url: "/helpmehack-mark.png",
        type: "image/png",
        sizes: "367x367",
      },
    ],
    shortcut: "/helpmehack-favicon.svg",
    apple: "/apple-icon.png",
  },
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
    title: "helpmehack — Find open source projects worth contributing to",
    description: siteDescription,
    images: [
      {
        url: "/helpmehack-mark.png",
        alt: "helpmehack",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "helpmehack — Find open source projects worth contributing to",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([websiteStructuredData, organizationStructuredData]),
          }}
        />
      </head>
      <body>
        <AnalyticsProvider />
        {children}
      </body>
    </html>
  );
}
