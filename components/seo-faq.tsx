import type { SeoQuestion } from "@/lib/seo-content";

export function SeoFaq({
  questions,
  title = "Frequently asked questions",
  intro,
  className = "",
}: {
  questions: SeoQuestion[];
  title?: string;
  intro?: string;
  className?: string;
}) {
  return (
    <section aria-labelledby="seo-faq-title" className={`x-border border-t pt-8 ${className}`}>
      <div className="max-w-[760px]">
        <h2 id="seo-faq-title" className="x-text text-2xl font-bold tracking-tight">{title}</h2>
        {intro && <p className="x-muted mt-3 max-w-[65ch] text-sm leading-6">{intro}</p>}
      </div>
      <div className="mt-7 grid gap-x-8 gap-y-7 md:grid-cols-2">
        {questions.map(({ question, answer }) => (
          <article key={question} className="x-border border-t pt-5">
            <h3 className="x-text text-base font-semibold leading-6">{question}</h3>
            <p className="x-muted mt-2 max-w-[62ch] text-sm leading-6">{answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
