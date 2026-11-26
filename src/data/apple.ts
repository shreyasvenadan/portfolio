// The two Apple program pages, /portfolio/academy/ (the Apple Developer
// Academy @ BINUS) and /portfolio/institute/ (the Apple Developer Institute
// for Entrepreneurship), told from the LinkedIn posts written along the way.

import type { ViewerPhoto } from '../components/PhotoViewer'

export type Section = {
  heading: string
  body?: string
  points?: string[]
  // Polaroids under the section, from public/academy-media, that open into
  // the photo viewer.
  photos?: ViewerPhoto[]
}

export type Program = {
  // Its page, at /portfolio/<id>/.
  id: 'academy' | 'institute'
  // Its short name, for the link to it from the other page.
  short: string
  name: string
  role: string
  location: string
  period: string
  logo: string
  lead: string
  sections: Section[]
  posts: { label: string; href: string }[]
}

const base = import.meta.env.BASE_URL
// `<name>.jpg` is the full-size image (2000px long edge), `<name>-sm.jpg`
// the 900px thumbnail for the wall; w and h give its shape.
const photo = (name: string, w: number, h: number, caption: string, alt: string): ViewerPhoto => ({
  full: `${base}academy-media/${name}.jpg`,
  thumb: `${base}academy-media/${name}-sm.jpg`,
  caption,
  alt,
  ratio: w / h,
})

export const programs: Program[] = [
  {
    id: 'academy',
    short: 'the Academy',
    name: 'Apple Developer Academy @ BINUS',
    role: 'iOS Developer',
    location: 'Bali, Indonesia',
    period: '2025',
    logo: `${base}apple-developer-academy-logo.png`,
    lead: 'I was selected for the inaugural cohort of the Apple Developer Academy @ BINUS in Bali, among the top 3% of applicants globally. Over the year I designed, built and shipped apps across iOS, watchOS and macOS in cross-cultural teams.',
    sections: [
      {
        heading: 'How it works',
        body: 'The Academy runs on challenge-based learning: each challenge starts from a real problem, and the team takes it through the full product lifecycle, from research and design to building, testing and shipping.',
      },
      {
        heading: 'Challenge 1: Help an Academy learner',
        body: "The first challenge was to help another learner at the Academy. Moving to Bali, it's hard to find familiarity and community, and for Ghina, keeping up daily religious practice somewhere that isn't Muslim-majority added more friction. I built her an iOS app that finds nearby mosques and musallahs, follows prayer-related events and helps her feel more connected. I took it from research to design to code on my own: I designed the whole app in Figma, then built it in Swift and Xcode.",
        photos: [
          photo('c1-app', 1292, 2000, 'mosques and prayer events nearby', "Two iPhones showing the app: a list of prayer events, and a mosque's page with its facilities, a map and reviews."),
          photo('c1-team', 997, 665, 'my first team at the Academy', 'A selfie of me with my Challenge 1 teammates and mentor at the Academy.'),
        ],
      },
      {
        heading: 'Challenge 2: GoPaw',
        body: 'The second challenge was to use Apple technologies in the right ways. We asked how the Apple Watch could encourage healthier habits in a playful way, and built GoPaw, a watchOS app with a virtual pet whose health is tied to your daily activity: walk more, and your pet thrives. It tracks activity in real time with Core Motion, HealthKit, WorkoutKit and WatchKit. I worked on the pixel-art UI and built several of the core watch screens: getting ready to walk, the live walk, pausing, and the walk summary.',
        photos: [
          photo('c2-watch', 1292, 2000, 'GoPaw on the Apple Watch', 'An Apple Watch showing GoPaw: a pixel-art dachshund on a grassy hill under a step counter.'),
          photo('c2-screens', 1618, 2000, 'ready, walk, pause, summary', "GoPaw's pixel-art watch screens: ready to walk, the live walk, pause, the walk summary, the store and the report."),
          photo('c2-team', 2000, 1868, 'team GoPaw', 'The GoPaw team in front of a screen showing the GoPaw title.'),
        ],
      },
      {
        heading: 'Challenge 3: Tiny',
        body: "The third challenge was about understanding the user deeply, without writing a single line of code. We worked with new mums, and the interviews were sensitive ones. What we learned was that the hardest moments come in the middle of the night, when their minds are most stretched. That led to Tiny, a baby-care logging app paired with a smart lamp whose colours show what the baby needs, so a mother doesn't have to pick up her phone. We took it from interviews to a high-fidelity prototype and presented that journey at our first exhibition.",
        photos: [
          photo('c3-poster', 1125, 2000, 'tiny.', 'Tiny\'s poster: two phones showing the app, and the line "Tiny steps, shared connections, endless strength. Even in darkness."'),
          photo('c3-screens', 1125, 2000, "Tiny's screens", "Tiny's screens: welcome, words of encouragement, returning the kindness, and the baby's care log."),
          photo('c3-team', 2000, 1933, 'team Tiny at our first exhibition', 'The Tiny team kneeling in front of our exhibition table and screens.'),
          photo('c3-table', 2000, 1500, 'our exhibition table', "Tiny's exhibition table: screens of the app, balloons and a plush toy."),
        ],
      },
      {
        heading: 'Challenge 4: SeaLens with Living Seas',
        body: "Challenge 4 took us out of the Academy to work with Living Seas on coral reef restoration in Padangbai. We snorkelled the restoration sites and spent a week interviewing researchers, interns and the local community about how they monitor the reef. Counting and identifying fish in underwater footage was done by hand, and it was the slowest part of their work. So we built SeaLens, an iOS app that uses machine learning to detect fish in underwater video and classify them by family. I built the SwiftUI interface and user flows and helped integrate the ML pipeline for detection and clustering, and we presented it to Indonesia's Minister of Industry.",
        photos: [
          photo('c4-iphone', 1125, 2000, 'SeaLens on iPhone', 'Two iPhones showing SeaLens: processed reef videos, and the fish collection sorted by family.'),
          photo('c4-living-seas', 2000, 1927, 'with Living Seas', 'The SeaLens team with Living Seas in front of screens showing SeaLens and the reef.'),
          photo('c4-minister', 2000, 1328, 'showing SeaLens to the Minister of Industry', 'Presenting SeaLens to a group of visiting officials at the Academy.'),
        ],
      },
      {
        heading: 'The Sunrise Challenge: SeaLens for the Mac',
        body: "The Sunrise Challenge, the Academy's last, let everyone form new teams. We chose to get back together for another go at SeaLens. Scientists told us they work through large volumes of footage at a desk, and a phone-first app didn't fit that, so we rebuilt it from the ground up as a macOS app in SwiftUI, SwiftData and Tuist, and shipped it free on the Mac App Store. It went on to win 1st place at the EU Conexus Innovation Contest 2025.",
        photos: [
          photo('c6-mac', 2000, 1193, 'SeaLens for the Mac', "Two MacBooks showing SeaLens for macOS: a dashboard of fish counts by family, and an upload's fish sorted by family."),
          photo('c6-presenting', 2000, 1125, 'presenting SeaLens', 'Me presenting SeaLens for the Mac in front of a big screen.'),
          photo('c6-pitch', 2000, 1500, 'the pitch', 'Me pitching SeaLens to a full room, the team waiting beside the screens on the problems facing coral reefs.'),
          photo('c6-booth', 2000, 1125, 'the SeaLens booth at the final exhibition', 'The SeaLens team and Living Seas at our exhibition booth.'),
          photo('c6-lisa-jackson', 2000, 1334, 'with Lisa Jackson', 'The SeaLens team with Lisa Jackson, holding a SeaLens sign.'),
        ],
      },
      {
        heading: 'Presenting it',
        body: 'Building a product is one challenge. Explaining it clearly is another. Presenting SeaLens to people who could help it grow was a big part of the year.',
        points: [
          'Spotlight Team: 1 of 4 chosen across all Indonesian Apple Developer Academies.',
          "Presented directly to Lisa Jackson, Apple's Vice President of Environment, Policy and Social Initiatives.",
          "Presented to Indonesia's Minister of Industry and the Vice Minister of Communication and Digital Affairs.",
          'Presented to three Apple Directors, Livingseas Asia and the Singapore Oceanarium, one of the largest aquariums in the world.',
        ],
      },
    ],
    posts: [
      {
        label: 'Challenge 1: an app to help an Academy learner feel at home in Bali',
        href: 'https://www.linkedin.com/posts/shreyasvenadan_appledeveloperacademy-iosdevelopment-swift-ugcPost-7420364618679853056-Oii0/',
      },
      {
        label: 'Challenge 2: GoPaw, a virtual pet on the Apple Watch',
        href: 'https://www.linkedin.com/posts/shreyasvenadan_appledeveloperacademy-watchos-healthkit-ugcPost-7420650277931737088-1CI6/',
      },
      {
        label: 'Challenge 3: Tiny, designed for new mums',
        href: 'https://www.linkedin.com/posts/shreyasvenadan_appledeveloperacademy-uxresearch-humancentereddesign-ugcPost-7421477158709129218-gujc/',
      },
      {
        label: 'Challenge 4: where SeaLens began, with Living Seas in Bali',
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
    ],
  },
  {
    id: 'institute',
    short: 'the Institute',
    name: 'Apple Developer Institute for Entrepreneurship',
    role: 'Co-Founder, SeaLens',
    location: 'Jakarta, Indonesia',
    period: '2026',
    logo: `${base}apple-developer-institute-logo.png`,
    lead: 'After the Academy, SeaLens was selected for the Apple Developer Institute for Entrepreneurship in Jakarta: a six-month Apple program for early-stage startups built on Apple platforms. It was the step from a project to a business.',
    sections: [
      {
        heading: 'Mentorship',
        body: 'We were mentored by our Entrepreneur in Residence, Jaka Wiradisuria, Chief Commercial Officer at IONext, who helped shape the direction of SeaLens.',
      },
      {
        heading: 'What we worked on',
        points: [
          'Growth strategy, fundraising and pitching to investors.',
          'Validating which features scientists actually needed, and cutting what they didn\'t.',
          'Milestone-driven sprints toward a commercial launch.',
        ],
      },
      {
        heading: 'What changed',
        body: "It changed how I think about SeaLens: not just a technical project, but a business solving a real problem. We graduated from the Institute in Jakarta, and the next goal is real adoption by blue-tech organisations across the region.",
        photos: [
          photo('adi-team', 2000, 1125, 'Graduation day', 'The SeaLens team in their black SeaLens tees, pointing at themselves in front of the Graduation’s Day screens.'),
          photo('adi-cohort', 2000, 1500, 'The graduating cohort', 'The whole Institute cohort gathered in front of the two Graduation’s Day screens.'),
        ],
      },
    ],
    posts: [
      {
        label: 'Graduating from the Apple Developer Institute for Entrepreneurship',
        href: 'https://www.linkedin.com/posts/shreyasvenadan_appledeveloperinstitute-entrepreneurship-ugcPost-7514960950043549696-kjwx/',
      },
    ],
  },
]
