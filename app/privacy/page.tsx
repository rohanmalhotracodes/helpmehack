import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy-page";

export const metadata: Metadata = { title: "Privacy notice | helpmehack", description: "This notice describes current data handling on helpmehack. Browsing requires no account, name, or payment details.", alternates: { canonical: "https://www.helpmehack.tech/privacy" } };

const sections = [
  { title: "Your browser", content: <p>Saved repository and issue IDs, plus your theme preference, use local browser storage without account sync. Unsave items individually, or clear this site&apos;s browser data to remove all local settings and bookmarks.</p> },
  { title: "Hosting and public data", content: <p>AWS Amplify receives your IP address and request information to serve this site. helpmehack&apos;s server requests public repository, issue, and avatar data from GitHub. Optional DynamoDB storage holds repository snapshots, not visitor accounts. Following external links sends requests to those websites.</p> },
  { title: "Analytics", content: <p>PostHog&apos;s US service, managed through Tin, receives page views, repository and issue clicks, errors, empty results, and optional feedback. Events include session and browser details, page paths, referring websites, repository names, and test labels. PostHog receives IP addresses. Session storage holds identifiers and referral details. Click signals help find browsing problems. Session recording is currently disabled in the hosted project. If enabled, recordings mask typed inputs and exclude feedback forms. Submitted ratings and comments are sent separately. Network bodies, headers, and console logs are not recorded. Do Not Track is respected. Analytics URLs exclude query strings and fragments.</p> },
  { title: "Email and deletion", content: <p>Newsletter signup is disabled; this site currently accepts no newsletter addresses. Support email goes to Tin&apos;s managed mailbox, including your sender address and message. Use the contact below for data questions or deletion requests. There is no self-service server-data deletion tool; clearing browser data does not delete sent emails or server records. <a className="focus-ring rounded underline underline-offset-4" href="mailto:helpmehack@mail.tin.computer">helpmehack@mail.tin.computer</a>.</p> }
];

export default function Page() {
  return <PolicyPage title="Privacy notice" introduction="This notice describes current data handling on helpmehack. Browsing requires no account, name, or payment details." sections={sections} />;
}
