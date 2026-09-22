export type SeoQuestion = {
  question: string;
  answer: string;
};

export const homepageFaq: SeoQuestion[] = [
  {
    question: "What is helpmehack?",
    answer: "helpmehack is an open-source discovery platform for finding active repositories, beginner-friendly issues, contribution programs, and the contribution rules that matter before you start.",
  },
  {
    question: "How do I find an open-source project to contribute to?",
    answer: "Browse Repos, filter by technologies you know, open a repository, and read the issue and contribution signals. Check the latest GitHub discussion before you begin because project status can change.",
  },
  {
    question: "Does helpmehack list GSoC organizations?",
    answer: "Yes. The Programs directory includes Google Summer of Code organization history, participation years, technologies, past projects, and links to official program sources where available.",
  },
  {
    question: "Does helpmehack include Summer of Bitcoin?",
    answer: "Yes. helpmehack includes Summer of Bitcoin cohort history from 2021 through 2026, with official year links and curated repository mappings where available.",
  },
  {
    question: "How is helpmehack different from a good-first-issue list?",
    answer: "helpmehack looks beyond an issue label. It surfaces repository context, contribution guidance, assignment signals, recent discussion, linked pull requests, program history, and project activity so you can investigate before committing time.",
  },
  {
    question: "Does helpmehack guarantee that an issue is available?",
    answer: "No. Availability is a starting signal, not a reservation. Maintainers control assignment and acceptance, so always read the latest issue discussion and the project's contribution rules on GitHub.",
  },
];

export const openSourceProjectsFaq: SeoQuestion[] = [
  {
    question: "What makes an open-source project beginner friendly?",
    answer: "A beginner-friendly project usually has clear setup instructions, an active contribution guide, responsive maintainers, scoped issues, and evidence that external contributors are accepted.",
  },
  {
    question: "Is a good first issue always unassigned?",
    answer: "No. A good first issue label describes intended difficulty, not current availability. Check assignees, recent comments, and linked pull requests before starting.",
  },
  {
    question: "How should I choose my first open-source repository?",
    answer: "Start with a language or tool you already understand, then prefer a maintained repository with clear contribution instructions and a small issue whose expected result you can reproduce and test.",
  },
  {
    question: "Do I need an account to browse helpmehack?",
    answer: "No. You can browse projects and contribution guidance without creating a helpmehack account. Contributions themselves continue on the project's GitHub repository.",
  },
];

export const programsFaq: SeoQuestion[] = [
  {
    question: "What open-source programs are available on helpmehack?",
    answer: "The Programs directory currently covers Google Summer of Code organization history and Summer of Bitcoin cohorts, with participation years, technologies, projects, repositories, and official source links where available.",
  },
  {
    question: "Can I filter GSoC organizations by technology and year?",
    answer: "Yes. You can select multiple participation years and multiple technologies, then search by organization, topic, or repository to narrow the directory.",
  },
  {
    question: "Does appearing in a past GSoC year mean an organization will return?",
    answer: "No. Historical participation is useful context, not a prediction. Always check the current official program source for the active year's accepted organizations and application details.",
  },
  {
    question: "Can I see previous GSoC projects?",
    answer: "Yes, where the source data provides them. Organization pages group historical projects by year and link to project or code pages when those links are available.",
  },
];

export const contributeFaq: SeoQuestion[] = [
  {
    question: "Do open-source contributions have to be code?",
    answer: "No. Documentation, bug reports, testing, reproduction steps, design, examples, and code fixes can all be valuable when they follow the project's contribution process.",
  },
  {
    question: "What should I do before starting an issue?",
    answer: "Read the contribution guide, reproduce the problem, check assignment and recent discussion, confirm the expected scope, and follow the maintainer's instructions for claiming or proposing work.",
  },
  {
    question: "What if an issue has unclear scope?",
    answer: "Ask a specific question describing what you reproduced, what you plan to change, and how you will test it. That gives maintainers enough context to confirm or redirect the work.",
  },
];
