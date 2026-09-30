// All site content lives here. Edit this file to update the portfolio.

export const profile = {
  name: 'Shreyas Venadan',
  role: 'Software Engineer',
  // TODO: replace with your own one-liner
  tagline: 'I build reliable, well-crafted software for the web.',
  // TODO: write a short bio (2–3 short paragraphs)
  about: [
    "I'm a software engineer who enjoys turning ideas into products people actually use. I care about clean code, thoughtful design, and shipping things that work.",
    'Outside of work, I like learning new tools, contributing to side projects, and ...',
  ],
  skills: ['TypeScript', 'React', 'Node.js', 'Python', 'SQL', 'Git'],
  // TODO: drop a PDF at public/resume.pdf, or set to '' to hide the button
  resumeUrl: `${import.meta.env.BASE_URL}resume.pdf`,
}

export const links = {
  github: 'https://github.com/shreyasvenadan',
  linkedin: 'https://www.linkedin.com/in/your-handle', // TODO
  email: 'you@example.com', // TODO
}

export type Project = {
  title: string
  description: string
  tech: string[]
  repo?: string
  demo?: string
}

// TODO: replace with your real projects (3–5 is ideal)
export const projects: Project[] = [
  {
    title: 'Project One',
    description: 'What it does, who it’s for, and the most interesting problem you solved building it.',
    tech: ['React', 'TypeScript', 'Tailwind'],
    repo: 'https://github.com/shreyasvenadan',
    demo: '',
  },
  {
    title: 'Project Two',
    description: 'A short description. Mention impact or numbers if you have them (users, speedups, etc.).',
    tech: ['Node.js', 'PostgreSQL'],
    repo: 'https://github.com/shreyasvenadan',
  },
  {
    title: 'Project Three',
    description: 'Another project that shows a different skill — backend, data, mobile, tooling, etc.',
    tech: ['Python', 'FastAPI'],
    repo: 'https://github.com/shreyasvenadan',
  },
]

export type Experience = {
  role: string
  org: string
  period: string
  points: string[]
}

// TODO: replace with your experience / education
export const experience: Experience[] = [
  {
    role: 'Software Engineer',
    org: 'Company Name',
    period: '2024 — Present',
    points: ['What you built or owned.', 'A measurable result you’re proud of.'],
  },
  {
    role: 'B.S. Computer Science',
    org: 'University Name',
    period: '2020 — 2024',
    points: ['Relevant coursework, honors, or clubs.'],
  },
]
