import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "helpmehack — Open source worth starting",
  description: "Evidence-ranked open-source issues and the contribution details beginners often miss.",
  icons: {
    icon: [{ url: "/helpmehack-mark.png", type: "image/png" }],
    apple: [{ url: "/helpmehack-mark.png", type: "image/png" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
