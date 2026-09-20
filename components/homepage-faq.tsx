const questions = [
  {
    question: "What is HelpMeHack?",
    answer: "HelpMeHack helps you find open-source projects to contribute to. It combines the Overlooked editorial feed with a directory of repositories and open issues.",
  },
  {
    question: "Who is it for?",
    answer: "It's for beginners choosing their first contribution and experienced developers looking for projects. You can browse without an account.",
  },
  {
    question: "How do I get started?",
    answer: "Open the Open Source tab and choose a repository. Read its contribution guide and issue details, then follow the project's instructions on GitHub.",
  },
];

export function HomepageFaq() {
  return (
    <section aria-labelledby="faq-title" className="x-border mt-10 border-t px-4 pt-8 sm:px-0">
      <h2 id="faq-title" className="x-text text-xl font-bold tracking-tight">Frequently asked questions</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-3 sm:gap-8">
        {questions.map(({ question, answer }) => (
          <div key={question}>
            <h3 className="x-text text-sm font-semibold">{question}</h3>
            <p className="x-muted mt-2 max-w-[60ch] text-sm leading-6">{answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
