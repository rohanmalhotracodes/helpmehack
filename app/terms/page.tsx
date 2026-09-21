import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy-page";

export const metadata: Metadata = { title: "Terms of use | HelpMeHack", description: "These terms describe how HelpMeHack works today. You can browse the Feed and repository directory without an account.", alternates: { canonical: "https://www.helpmehack.tech/terms" } };

const sections = [
  { title: "Using repository guidance", content: <p>HelpMeHack helps you explore public projects and issues. Rankings and availability labels reflect collected evidence, which can be incomplete or outdated. Check the latest issue discussion before starting work. An issue listing does not reserve work or guarantee acceptance.</p> },
  { title: "Contributing on GitHub", content: <p>Follow each project&apos;s license, contribution guide, and code of conduct. Maintainers decide whether to accept contributions. HelpMeHack does not assign issues, submit contributions, or control linked projects.</p> },
  { title: "External content", content: <p>Feed stories and repository links lead to other websites. Their terms and privacy practices apply when you visit them. Repository information comes from GitHub; project names and content remain those of their respective owners.</p> },
  { title: "Current features", content: <p>Bookmarks stay in your browser. There is no account sync, checkout, or paid plan in the current product. Newsletter signup is currently unavailable.</p> },
  { title: "Questions", content: <p>Contact support for questions about these terms or the site. Our <a className="focus-ring rounded underline underline-offset-4" href="/privacy">Privacy notice</a> explains current data handling. <a className="focus-ring rounded underline underline-offset-4" href="mailto:helpmehack@mail.tin.computer">helpmehack@mail.tin.computer</a>.</p> }
];

export default function Page() {
  return <PolicyPage title="Terms of use" introduction="These terms describe how HelpMeHack works today. You can browse the Feed and repository directory without an account." sections={sections} />;
}
