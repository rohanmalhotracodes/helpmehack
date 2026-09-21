import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy-page";

export const metadata: Metadata = { title: "Privacy notice | HelpMeHack", description: "This notice describes current data handling on HelpMeHack. Browsing requires no account, name, or payment details.", alternates: { canonical: "https://main.d27aveplt50hl3.amplifyapp.com/privacy" } };

const sections = [
  { title: "Your browser", content: <p>Saved repository and issue IDs, plus your theme preference, use local browser storage without account sync. Unsave items individually, or clear this site&apos;s browser data to remove all local settings and bookmarks.</p> },
  { title: "Hosting and public data", content: <p>AWS Amplify receives your IP address and request information to serve this site. HelpMeHack&apos;s server requests public repository, issue, and avatar data from GitHub. Optional DynamoDB storage holds repository snapshots, not visitor accounts. Following external links sends requests to those websites.</p> },
  { title: "Analytics", content: <p>PostHog tracking is currently disabled on this Amplify address. The code enables it only on the custom domain. There, it sends page views, repository opens, and issue clicks to PostHog&apos;s US service, managed through Tin. Events include session identifiers, browser details, page paths, repository names, and issue numbers. PostHog also receives network information such as IP addresses. Session storage holds analytics identifiers. Session recording and automatic click capture are disabled; Do Not Track is respected. URL query strings and fragments are removed.</p> },
  { title: "Email and deletion", content: <p>Newsletter signup is disabled; this site currently accepts no newsletter addresses. Support email goes to Tin&apos;s managed mailbox, including your sender address and message. Use the contact below for data questions or deletion requests. There is no self-service server-data deletion tool; clearing browser data does not delete sent emails or server records. <a className="focus-ring rounded underline underline-offset-4" href="mailto:helpmehack@mail.tin.computer">helpmehack@mail.tin.computer</a>.</p> }
];

export default function Page() {
  return <PolicyPage title="Privacy notice" introduction="This notice describes current data handling on HelpMeHack. Browsing requires no account, name, or payment details." sections={sections} />;
}
