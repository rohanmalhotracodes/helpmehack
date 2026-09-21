const siteUrl = "https://www.helpmehack.tech";

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

export function SoftwareStructuredData() {
  return <JsonLd data={{
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${siteUrl}/#software`,
    name: "HelpMeHack",
    url: siteUrl,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web browser",
    description: "Find open-source repositories, review contribution guidance and issue availability signals, then continue on GitHub.",
    publisher: { "@id": `${siteUrl}/#organization` },
  }} />;
}

export function ComparisonStructuredData({ title, description, url }: {
  title: string;
  description: string;
  url: string;
}) {
  return <JsonLd data={{
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: title,
    description,
    isPartOf: { "@id": `${siteUrl}/#website` },
    publisher: { "@id": `${siteUrl}/#organization` },
    about: { "@id": `${siteUrl}/#software` },
  }} />;
}
