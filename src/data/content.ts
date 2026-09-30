// All site content lives here. Edit this file to update the portfolio.

export const profile = {
  name: 'Shreyas Venadan',
  role: 'Software Engineer',
  tagline:
    'Software engineer in Melbourne. I co-founded SeaLens, which uses machine learning to find, track and count fish in underwater reef footage.',
  about: [
    "I'm a software engineering student at RMIT in Melbourne, graduating in November 2026. I was selected for the inaugural Apple Developer Academy @ BINUS cohort in Bali (top 3% of applicants globally), where I designed, built and shipped apps across iOS, watchOS and macOS in cross-cultural teams.",
    "There I co-founded SeaLens, a macOS and web app that helps marine scientists monitor reef biodiversity by detecting, tracking and classifying fish in underwater video with machine learning. SeaLens won 1st place at the EU Conexus Innovation Contest 2025 and was selected for Apple's Developer Institute for Entrepreneurship.",
    'Outside of code I do photography and videography, coach youth football, and have played competitive football for 14+ years.',
  ],
  skills: {
    Languages: ['Swift', 'TypeScript', 'JavaScript', 'Python', 'Java', 'C++', 'PHP', 'SQL'],
    'Frameworks & Platforms': [
      'SwiftUI',
      'SwiftData',
      'React',
      'Next.js',
      'Vite',
      'Express',
      'Tailwind CSS',
      'Supabase',
      'Tuist',
      'AWS',
      'PostgreSQL',
      'MySQL',
    ],
    'Machine Learning': ['Regression', 'Classification', 'Neural networks', 'Transfer learning', 'Feature engineering'],
    Tools: ['Xcode', 'Git', 'GitHub', 'Figma', 'Agile/Scrum', 'Unit testing'],
  } as Record<string, string[]>,
  // Export your résumé as PDF to public/resume.pdf, then set this to
  // `${import.meta.env.BASE_URL}resume.pdf` to show the Résumé button.
  resumeUrl: '',
}

export const links = {
  github: 'https://github.com/shreyasvenadan',
  linkedin: 'https://www.linkedin.com/in/shreyasvenadan',
  email: 'shreyasvenadan10@gmail.com',
}

export type Project = {
  title: string
  description: string
  tech: string[]
  repo?: string
  demo?: string
}

export const projects: Project[] = [
  {
    title: 'SeaLens',
    description:
      'macOS and web app that helps marine scientists analyse reef biodiversity by automatically detecting, tracking and classifying fish in underwater video. 1st place at the EU Conexus Innovation Contest 2025; presented to Apple VP Lisa Jackson.',
    tech: ['SwiftUI', 'SwiftData', 'Tuist', 'React', 'TypeScript', 'Supabase', 'ML'],
    demo: 'https://sealens.app',
  },
  {
    title: 'MyKaleidoscope',
    description:
      'Goal-tracking and personal development platform for Spectrum Tuition. Built onboarding and Wheel of Life assessment flows, plus Google Calendar integration to turn goal deadlines into events.',
    tech: ['Next.js', 'React', 'Express', 'Supabase', 'PostgreSQL', 'Tailwind CSS'],
  },
  {
    title: 'Machine Learning Projects',
    description:
      'Regression models predicting Melbourne Airbnb prices, classifiers predicting wildfire intensity across 7 global regions, and a histopathology image classifier for colon cancer cells using data augmentation and transfer learning.',
    tech: ['Python', 'Regression', 'Neural networks', 'Transfer learning'],
  },
  {
    title: 'Cloud Music Subscription Service',
    description:
      'Cloud-based music subscription service with a Python backend and RESTful APIs, hosted and managed on AWS infrastructure.',
    tech: ['Python', 'AWS EC2', 'S3', 'API Gateway', 'Lambda', 'DynamoDB'],
  },
  {
    title: 'Web Development with RMIT Data',
    description:
      'Multiple websites built on real RMIT data in an Agile Scrum team, with Figma prototypes, user stories, acceptance tests and unit testing.',
    tech: ['React', 'JavaScript', 'Java', 'MySQL', 'Figma'],
  },
  {
    title: 'Secure E-Commerce',
    description:
      'E-commerce applications integrating PayPal, Google Pay and reCAPTCHA, hardened through vulnerability assessments and simulated attacks.',
    tech: ['PHP', 'PayPal', 'Google Pay', 'reCAPTCHA'],
  },
]

export type Experience = {
  role: string
  org: string
  location?: string
  period: string
  points: string[]
}

export const experience: Experience[] = [
  {
    role: 'Co-Founder, Tech and Marketing Lead',
    org: 'SeaLens',
    period: '2025 — Present',
    points: [
      'Co-led development of the production macOS app (SwiftUI, SwiftData, Tuist), integrating machine-learning outputs into a scientist-friendly workflow.',
      'Led development of the SeaLens web app (React, TypeScript, Vite, Supabase), extending access beyond macOS.',
      'Selected as a Spotlight Team (1 of 4 across all Indonesian Apple Developer Academies); presented to Indonesian ministers, three Apple Directors and the Singapore Oceanarium.',
      '1st place at the EU Conexus Innovation Contest 2025.',
    ],
  },
  {
    role: 'RMIT Industry Project',
    org: 'Spectrum Tuition',
    location: 'Melbourne, VIC',
    period: '2026 — Present',
    points: [
      'Building MyKaleidoscope in Agile sprints using a full-stack TypeScript monorepo (Next.js, React, Express, Supabase).',
      'Built onboarding and Wheel of Life assessment flows, and Google Calendar integration for goal deadlines.',
    ],
  },
  {
    role: 'Co-Founder, SeaLens',
    org: 'Apple Developer Institute for Entrepreneurship',
    location: 'Jakarta, Indonesia',
    period: '2026',
    points: [
      'Six-month Apple-run program for early-stage startups built on Apple platforms.',
      'Mentored by an Entrepreneur in Residence on growth strategy, fundraising and investor pitching.',
    ],
  },
  {
    role: 'iOS Developer',
    org: 'Apple Developer Academy @ BINUS',
    location: 'Bali, Indonesia',
    period: '2025',
    points: [
      'Selected among the top 3% of applicants globally for the inaugural cohort.',
      'Designed, built and shipped apps across iOS, watchOS and macOS through the full product lifecycle.',
    ],
  },
  {
    role: 'Bachelor of Software Engineering',
    org: 'RMIT University',
    location: 'Melbourne, VIC',
    period: '2022 — Nov 2026',
    points: [],
  },
]
