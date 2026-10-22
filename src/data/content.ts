// All site content lives here. Edit this file to update the portfolio.

export const profile = {
  name: 'Shreyas Venadan',
  role: 'Software Engineer',
  tagline:
    'I\'m a Software engineer in Melbourne. I co-founded SeaLens, which uses machine learning to find, track and count fish in underwater reef footage.',
  about: [
    "I'm a software engineering student at RMIT in Melbourne, graduating in 2026. I was selected for the inaugural Apple Developer Academy @ BINUS cohort in Bali (top 3% of applicants globally), where I designed, built and shipped apps across iOS, watchOS and macOS in cross-cultural teams.",
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
  linkedin: 'https://www.linkedin.com/in/shreyasvenadan/',
  youtube: 'https://www.youtube.com/@shreyasvenadan',
  email: 'shreyasvenadan10@gmail.com',
  resume: `${import.meta.env.BASE_URL}shreyas-venadan-resume.pdf`,
}

export type Project = {
  title: string
  description: string
  tech: string[]
  repo?: string
  demo?: string
  // Where to download it, e.g. the Mac App Store.
  app?: string
  // Its icon, in public/.
  logo?: string
  // The longer story, on the project's own page (a "More about" link).
  details?: { heading: string; body?: string; points?: string[]; links?: { label: string; href: string }[] }[]
}

export const projects: Project[] = [
  {
    title: 'SeaLens',
    description:
      'macOS and web app that uses machine learning to identify, track and count fish populations in underwater reef video.',
    tech: ['SwiftUI', 'SwiftData', 'Tuist', 'React', 'TypeScript', 'Vite', 'Supabase', 'YOLOv12', 'SwiftFormer', 'CPEA'],
    demo: 'https://sealens.app',
    app: 'https://apps.apple.com/au/app/sealens/id6755988477?mt=12',
    logo: `${import.meta.env.BASE_URL}sealens-logo.svg`,
    details: [
      {
        heading: 'The problem',
        body: 'Coral reefs support over 25% of marine life, yet more than half are already gone, and up to 90% could disappear by 2050. Fish populations are one of the clearest signals of how a reef, or a restoration project, is doing. But scientists count those fish by hand, from dives and hours of underwater video. It takes hundreds of hours, it varies from person to person, and it doesn\'t scale across reefs, so the data often arrives after the decisions it was meant to inform.',
      },
      {
        heading: 'What SeaLens does',
        body: 'Upload underwater footage, from cameras, drones or dives, and SeaLens detects, identifies and counts the fish in it, sorted into families with a count for each. It turns weeks of manual review into minutes.',
        points: [
          'Detects and identifies 100+ fish species commonly found on reefs.',
          'Scientists stay in control: they review each result, confirm or correct it, and the validated data makes the model more accurate for their ecosystem over time.',
          'Charts how each fish family\'s population changes across observations, so teams can track reef health and restoration impact.',
          'Exports structured data for research, reporting, publication and policy decisions.',
        ],
      },
      {
        heading: 'How it works',
        body: 'Each video goes through a machine-learning pipeline of three models, then back to the scientist for review.',
        points: [
          'Detection: YOLOv12 scans every frame to find each individual fish.',
          'Tracking: CPEA re-identifies the same fish from frame to frame, so no fish is counted twice.',
          'Classification: SwiftFormer works out the family of each fish it finds.',
          'Review: the scientist confirms, corrects or flags each result, and those corrections feed the next version of the model.',
          'Large videos upload resumably (TUSKit), so a dropped connection on a field trip doesn\'t mean starting over.',
        ],
      },
      {
        heading: 'Where it started',
        body: 'SeaLens began as a challenge at the Apple Developer Academy @ BINUS in Bali, working with Living Seas on coral reef restoration in Padangbai. We snorkelled the restoration sites and interviewed researchers and the local community, and found that monitoring fish was the slowest part of their work. Our first version was an iOS app that detected fish in underwater video and classified them by family. I built the SwiftUI interface and helped integrate the ML pipeline, and we presented it to Indonesia\'s Minister of Industry.',
      },
      {
        heading: 'Rebuilt for the Mac',
        body: 'For the Academy\'s final challenge our team got back together for another go at SeaLens. Feedback from researchers was clear: they work through large volumes of footage at a desk, and a phone-first app didn\'t fit that. So we rebuilt SeaLens from the ground up as a macOS app in SwiftUI, SwiftData and Tuist. It\'s free on the Mac App Store.',
      },
      {
        heading: 'Then the web',
        body: 'Not every lab runs on Macs. As tech lead, I led the SeaLens web app at sealens.app, built with React, TypeScript, Vite and Supabase, so any researcher or organisation can analyse reef footage in the browser. It has magic-link sign-in, resumable uploads, a guided tour on a sample clip, review and correction of every detection, population charts and data export. SeaLens is in a pilot phase with marine scientists in Bali, and is taking on more research and conservation teams as pilot partners.',
      },
      {
        heading: 'My role',
        points: [
          'Co-founder, and tech and marketing lead, from 2025.',
          'Co-led the production macOS app (SwiftUI, SwiftData, Tuist), bringing the machine-learning output into a workflow scientists can use.',
          'Led the web app (React, TypeScript, Vite, Supabase), so SeaLens works beyond the Mac.',
          'Own how SeaLens is positioned and how we reach out to scientists, conservation groups and partners.',
          'Presented SeaLens at executive showcases, including directly to Lisa Jackson, Apple\'s Vice President of Environment, Policy and Social Initiatives.',
        ],
      },
      {
        heading: 'Building the business',
        body: 'In 2026 SeaLens was selected for the Apple Developer Institute for Entrepreneurship in Jakarta, a six-month Apple program for early-stage startups built on Apple platforms. With mentorship from our Entrepreneur in Residence, Jaka Wiradisuria (Chief Commercial Officer at IONext), we worked through growth strategy, fundraising and investor pitching, validated which features scientists actually needed, and ran milestone-driven sprints toward a commercial launch. It changed how I think about SeaLens: not just a technical project, but a business solving a real problem. The next goal is real adoption by blue-tech organisations across the region.',
      },
      {
        heading: 'Recognition',
        points: [
          '1st place at the EU Conexus Innovation Contest 2025, which brought interest from marine science organisations in deploying and collaborating on SeaLens.',
          'Spotlight Team: 1 of 4 chosen across all Indonesian Apple Developer Academies.',
          'Presented to Lisa Jackson, Apple\'s Vice President of Environment, Policy and Social Initiatives.',
          'Presented to Indonesia\'s Minister of Industry, the Vice Minister of Communication and Digital Affairs, three Apple Directors, Livingseas Asia and the Singapore Oceanarium, one of the world\'s largest aquariums.',
          'Selected for, and graduated from, the Apple Developer Institute for Entrepreneurship.',
        ],
      },
      {
        heading: 'Read more',
        body: 'The story so far, as I wrote it along the way.',
        links: [
          {
            label: 'Where SeaLens began: reef monitoring with Living Seas in Bali',
            href: 'https://www.linkedin.com/posts/shreyasvenadan_appledeveloperacademy-aiforgood-swiftui-ugcPost-7421793440746848256-KhQU/',
          },
          {
            label: 'Rebuilding SeaLens for the Mac, and presenting to Apple',
            href: 'https://www.linkedin.com/posts/shreyasvenadan_appledeveloperacademy-sealens-aiforgood-ugcPost-7467823222361608192-rBml/',
          },
          {
            label: 'Building a product is one challenge. Explaining it clearly is another.',
            href: 'https://www.linkedin.com/posts/shreyasvenadan_building-a-product-is-one-challenge-explaining-ugcPost-7467846217863991296-PLZd/',
          },
          {
            label: 'Graduating from the Apple Developer Institute for Entrepreneurship',
            href: 'https://www.linkedin.com/posts/shreyasvenadan_appledeveloperinstitute-entrepreneurship-ugcPost-7514960950043549696-kjwx/',
          },
          { label: 'SeaLens on LinkedIn', href: 'https://www.linkedin.com/company/sealensapp/' },
        ],
      },
    ],
  },
  {
    title: 'MyKaleidoscope',
    description:
      'Goal-tracking and personal development platform for Spectrum Tuition. Built onboarding and Wheel of Life assessment flows, plus Google Calendar integration to turn goal deadlines into events.',
    tech: ['Next.js', 'React', 'Express', 'Supabase', 'PostgreSQL', 'Tailwind CSS'],
    logo: `${import.meta.env.BASE_URL}spectrum-tuition-logo.png`,
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
    period: '2026',
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
    period: '2022 — 2026',
    points: [],
  },
]

// The note inside the message in a bottle on the sea floor (click the bottle
// to break it open). Placeholder for now: write whatever you like here.
export const bottleNote = {
  title: 'you found it!',
  body: [
    'You swam all the way down to the sea floor and cracked open my message in a bottle. Thanks for exploring.',
    "This note is still being written, so check back soon to see what washes up.",
  ],
  signoff: '— shreyas',
}
