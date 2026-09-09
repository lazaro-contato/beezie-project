export interface Fact {
  readonly title: string;
  readonly body: string;
}

export interface Me {
  readonly name: string;
  readonly initials: string;
  readonly handle: string;
  readonly role: string;
  /** Where and in what languages. One line, under the role. */
  readonly meta: string;
  readonly bio: string;
  readonly note: string;
  readonly email: string;
  readonly github: string;
  readonly facts: readonly Fact[];
}

export const ME: Me = {
  name: "José Lázaro",
  initials: "JL",
  handle: "@lazaro-contato",
  role: "Software engineer. React Native, Next.js and TypeScript end to end.",
  meta: "Brazil · EN (advanced) · PT-BR (native)",
  bio: "Around five years of professional experience building products in TypeScript. My core is React Native and Next.js: mobile apps and server-rendered web, with a focus on performance, accessibility and interaction detail. From there I work across the stack and into software architecture: Node.js and Go services, REST and GraphQL APIs, distributed systems and cloud. AI tooling is part of how I design, code and ship.",
  note: "Software engineer from Brazil. React Native and Next.js in TypeScript, across the stack and into architecture. This Claw experience is mine from the server rendering to the reveal choreography and the swap flow.",
  email: "contato.jlazaro@gmail.com",
  github: "https://github.com/lazaro-contato",
  facts: [
    {
      title: "React Native",
      body: "Cross-platform mobile apps in TypeScript, with the performance work that keeps lists and animations smooth.",
    },
    {
      title: "Next.js and React",
      body: "Server-rendered web, the App Router and RSC boundaries, accessibility and Core Web Vitals.",
    },
    {
      title: "Full-stack and architecture",
      body: "Node.js and Go services, REST and GraphQL APIs, distributed systems, cloud and CI/CD.",
    },
    {
      title: "AI-assisted engineering",
      body: "LLM-driven workflows for architecture, refactoring, testing and review, and AI features designed into the product.",
    },
  ],
};

export const MAILTO = `mailto:${ME.email}?subject=${encodeURIComponent("Let's work together")}`;
