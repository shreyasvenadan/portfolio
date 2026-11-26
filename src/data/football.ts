// Photos and video on the football page (src/components/Football.tsx).
// Files live in public/football-media: `<name>.jpg` is the full-size image
// (2000px long edge), `<name>-sm.jpg` the 900px grid thumbnail.

export type Category = 'Matchday' | 'Team' | 'Silverware'

export interface Photo {
  name: string
  caption: string
  category: Category
  // Width / height, so the grid reserves space before images load.
  ratio: number
}

const media = (file: string) => `${import.meta.env.BASE_URL}football-media/${file}`
export const thumb = (p: Photo) => media(`${p.name}-sm.jpg`)
export const full = (p: Photo) => media(`${p.name}.jpg`)

export const video = {
  src: media('highlights.mp4'),
  loop: media('hero-loop.mp4'),
  poster: media('highlights-poster.jpg'),
  length: '0:46',
}

export const categories: Category[] = ['Matchday', 'Team', 'Silverware']

export const photos: Photo[] = [
  { name: 'best-and-fairest', caption: 'Best and Fairest, 2026', category: 'Silverware', ratio: 3 / 4 },
  { name: 'net-winners', caption: 'KMCC, 2024', category: 'Silverware', ratio: 4 / 3 },
  { name: 'trophy-night', caption: 'KMCC Winner & Best Player, 2026', category: 'Silverware', ratio: 3 / 4 },
  { name: 'golden-boots', caption: 'golden boots, 2026', category: 'Silverware', ratio: 2 / 3 },
  { name: 'trophies-bonnet', caption: 'trophies on display', category: 'Silverware', ratio: 2 / 3 },
  { name: 'lineup', caption: 'Lined up before kick-off', category: 'Matchday', ratio: 3 / 2 },
  { name: 'number-nine', caption: 'night games', category: 'Matchday', ratio: 4 / 5 },
  { name: 'medal-selfie', caption: 'Medal round the neck', category: 'Silverware', ratio: 3 / 4 },
  { name: 'squad', caption: 'squad', category: 'Team', ratio: 3 / 2 },
  { name: 'on-the-ball', caption: 'On the ball', category: 'Matchday', ratio: 1608 / 2000 },
  { name: 'trophy-dusk', caption: 'First Trophy Win, 2023', category: 'Silverware', ratio: 3 / 4 },
  { name: 'halfway-line', caption: 'penalty shootout', category: 'Matchday', ratio: 3 / 4 },
  { name: 'post-match', caption: 'Winding down after the game', category: 'Team', ratio: 3 / 2 },
  { name: 'floodlit-huddle', caption: 'Huddle under the floodlights', category: 'Matchday', ratio: 1608 / 2000 },
  { name: 'kit-trio', caption: 'brisbane tournament, 2026', category: 'Team', ratio: 4 / 3 },
  { name: 'presentation', caption: 'Prize presentation', category: 'Silverware', ratio: 3 / 2 },
  { name: 'from-the-sideline', caption: 'From the sideline', category: 'Matchday', ratio: 2 / 3 },
  { name: 'boot-silverware', caption: 'A boot full of trophies', category: 'Silverware', ratio: 3 / 4 },
  { name: 'awards-night', caption: 'Awards night', category: 'Silverware', ratio: 3 / 2 },
  { name: 'night-trio', caption: 'Under the lights', category: 'Team', ratio: 4 / 3 },
  { name: 'medal-mum', caption: 'winning with your parents by your side', category: 'Silverware', ratio: 3 / 4 },
  { name: 'car-trophies', caption: 'Awards night, 2025', category: 'Silverware', ratio: 3 / 4 },
]
