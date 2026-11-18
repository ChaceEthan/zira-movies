export interface SeedGenre {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface SeedMovie {
  id: string;
  title: string;
  slug: string;
  description: string;
  releaseYear: number;
  durationMinutes: number;
  maturityRating: string;
  language: string;
  country: string;
  subtitlesAvailable: string[];
  isFeatured: boolean;
  isTrending: boolean;
  isRwandanContent: boolean;
  isAfricanContent: boolean;
  isTop10: boolean;
  top10Rank?: number;
  viewCount: number;
  likeCount: number;
  averageRating: number;
  state: 'DRAFT' | 'UPLOADED' | 'PROCESSING' | 'READY' | 'PUBLISHED' | 'UNPUBLISHED' | 'ARCHIVED';
  posterUrl: string;
  backdropUrl: string;
  trailerUrl: string;
  videoUrl: string;
  genres: string[];
  cast: string[];
  rightsStatus: 'OWNED' | 'LICENSED' | 'PERMISSION_GRANTED' | 'PUBLIC_DOMAIN' | 'PENDING_VERIFICATION' | 'EXPIRED';
  rightsHolder: string;
  licenseReference: string;
  territories: string[];
  rightsEndDate?: string | null;
}

export interface SeedEpisode {
  id: string;
  episodeNumber: number;
  title: string;
  description: string;
  durationMinutes: number;
  thumbnailUrl: string;
  videoUrl: string;
  state: 'PUBLISHED';
}

export interface SeedSeason {
  id: string;
  seasonNumber: number;
  title: string;
  description: string;
  episodes: SeedEpisode[];
}

export interface SeedSeries {
  id: string;
  title: string;
  slug: string;
  description: string;
  releaseYear: number;
  maturityRating: string;
  language: string;
  isFeatured: boolean;
  isTrending: boolean;
  isRwandanContent: boolean;
  isAfricanContent: boolean;
  isTop10: boolean;
  top10Rank?: number;
  viewCount: number;
  averageRating: number;
  state: 'PUBLISHED';
  posterUrl: string;
  backdropUrl: string;
  trailerUrl: string;
  genres: string[];
  cast: string[];
  rightsStatus: 'OWNED' | 'LICENSED' | 'PERMISSION_GRANTED' | 'PUBLIC_DOMAIN';
  rightsHolder: string;
  licenseReference: string;
  seasons: SeedSeason[];
}

function createArtworkDataUrl(
  title: string,
  subtitle: string,
  accentA: string,
  accentB: string,
  width: number,
  height: number,
): string {
  const safeTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeSub = subtitle.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#050811"/>
        <stop offset="50%" stop-color="${accentA}"/>
        <stop offset="100%" stop-color="#090d16"/>
      </linearGradient>
      <radialGradient id="glow" cx="75%" cy="25%" r="60%">
        <stop offset="0%" stop-color="${accentB}" stop-opacity="0.55"/>
        <stop offset="100%" stop-color="#050811" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <rect width="100%" height="100%" fill="url(#glow)"/>
    <g fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2">
      <circle cx="${Math.round(width * 0.78)}" cy="${Math.round(height * 0.28)}" r="${Math.round(Math.min(width, height) * 0.26)}"/>
      <circle cx="${Math.round(width * 0.78)}" cy="${Math.round(height * 0.28)}" r="${Math.round(Math.min(width, height) * 0.16)}"/>
    </g>
    <rect x="${Math.round(width * 0.08)}" y="${Math.round(height * 0.1)}" width="84" height="28" rx="4" fill="#E50914"/>
    <text x="${Math.round(width * 0.08) + 42}" y="${Math.round(height * 0.1) + 19}" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-weight="800" font-size="13" letter-spacing="2">ZIRA</text>
    <text x="${Math.round(width * 0.08)}" y="${Math.round(height * 0.74)}" fill="#ffffff" font-family="Arial, sans-serif" font-weight="800" font-size="${width > 900 ? 48 : 30}" letter-spacing="0.5">${safeTitle}</text>
    <text x="${Math.round(width * 0.08)}" y="${Math.round(height * 0.82)}" fill="#cbd5e1" font-family="Arial, sans-serif" font-weight="600" font-size="${width > 900 ? 22 : 15}" letter-spacing="1.5">${safeSub}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const OPEN_VIDEOS = {
  bbb: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  sintel: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  tos: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  ed: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  blazes: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  escapes: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
};

export const SEED_GENRES: SeedGenre[] = [
  { id: 'genre-action', name: 'Action', slug: 'action', description: 'High-stakes adventures and kinetic cinema' },
  { id: 'genre-drama', name: 'Drama', slug: 'drama', description: 'Character-driven cinema and emotional storytelling' },
  { id: 'genre-comedy', name: 'Comedy', slug: 'comedy', description: 'Wit, satire, and lighthearted entertainment' },
  { id: 'genre-sci-fi', name: 'Sci-Fi', slug: 'sci-fi', description: 'Speculative futures, technology, and discovery' },
  { id: 'genre-thriller', name: 'Thriller', slug: 'thriller', description: 'Suspense, intrigue, and high tension' },
  { id: 'genre-documentary', name: 'Documentary', slug: 'documentary', description: 'Real stories, history, and nature' },
  { id: 'genre-animation', name: 'Animation', slug: 'animation', description: ' Stylized and computer-generated visual storytelling' },
  { id: 'genre-fantasy', name: 'Fantasy', slug: 'fantasy', description: 'Mythic worlds and epic quests' },
  { id: 'genre-mystery', name: 'Mystery', slug: 'mystery', description: 'Investigative puzzles and secrets' },
  { id: 'genre-family', name: 'Family', slug: 'family', description: 'All-ages stories for the entire household' },
  { id: 'genre-adventure', name: 'Adventure', slug: 'adventure', description: 'Journeys across extraordinary landscapes' },
  { id: 'genre-rwandan', name: 'Rwandan Cinema', slug: 'rwandan-cinema', description: 'Stories crafted in Rwanda and East Africa' },
];

/**
 * Curated Demo Movie Catalog (6 entries total):
 * - 5 PUBLISHED Creative Commons / Open-Movie films from the Blender Foundation with real license references.
 * - 1 DRAFT Demo Submission with PENDING_VERIFICATION rights status to demonstrate rights enforcement in the Admin Console.
 */
export const ALL_SEED_MOVIES: SeedMovie[] = [
  {
    id: 'movie-big-buck-bunny',
    title: 'Big Buck Bunny',
    slug: 'big-buck-bunny',
    description:
      'A gentle giant rabbit wakes up in a vibrant meadow only to face three mischievous woodland bullies—Frank, Rinky, and Gamera—turning a peaceful morning into slapstick forest justice. Produced by the Blender Foundation under Creative Commons Attribution 3.0.',
    releaseYear: 2008,
    durationMinutes: 10,
    maturityRating: 'G',
    language: 'English',
    country: 'Netherlands',
    subtitlesAvailable: ['en', 'fr', 'rw'],
    isFeatured: true,
    isTrending: true,
    isRwandanContent: false,
    isAfricanContent: false,
    isTop10: true,
    top10Rank: 1,
    viewCount: 18420,
    likeCount: 2450,
    averageRating: 4.8,
    state: 'PUBLISHED',
    posterUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Big_buck_bunny_poster_big.jpg',
    backdropUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Big.Buck.Bunny.-.Opening.Screen.png',
    trailerUrl: OPEN_VIDEOS.bbb,
    videoUrl: OPEN_VIDEOS.bbb,
    genres: ['animation', 'comedy', 'family'],
    cast: ['Sacha Goedegebure', 'Andreas Goralczyk', 'Enrico Valenza', 'Nathan Vegdahl'],
    rightsStatus: 'PUBLIC_DOMAIN',
    rightsHolder: 'Blender Foundation (CC-BY 3.0)',
    licenseReference: 'CC-BY-3.0-BLENDER-BBB-2008',
    territories: ['GLOBAL', 'RW'],
    rightsEndDate: null,
  },
  {
    id: 'movie-sintel',
    title: 'Sintel',
    slug: 'sintel',
    description:
      'A lone young warrior named Sintel travels across windswept desert plains and frozen mountain peaks searching for Scales, a baby dragon she nursed back to health, leading to a devastating revelation. Open movie project by the Blender Institute (CC-BY 3.0).',
    releaseYear: 2010,
    durationMinutes: 15,
    maturityRating: 'PG',
    language: 'English',
    country: 'Netherlands',
    subtitlesAvailable: ['en', 'fr', 'rw', 'sw'],
    isFeatured: true,
    isTrending: true,
    isRwandanContent: false,
    isAfricanContent: false,
    isTop10: true,
    top10Rank: 2,
    viewCount: 24910,
    likeCount: 3890,
    averageRating: 4.9,
    state: 'PUBLISHED',
    posterUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8f/Sintel_poster.jpg',
    backdropUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b2/Sintel_wallpaper_dragon.jpg',
    trailerUrl: OPEN_VIDEOS.sintel,
    videoUrl: OPEN_VIDEOS.sintel,
    genres: ['animation', 'fantasy', 'drama', 'adventure'],
    cast: ['Halina Reijn', 'Thom Hoffman', 'Colin Levy', 'David Revoy'],
    rightsStatus: 'LICENSED',
    rightsHolder: 'Blender Foundation (CC-BY 3.0)',
    licenseReference: 'CC-BY-3.0-BLENDER-SINTEL-2010',
    territories: ['GLOBAL', 'RW'],
    rightsEndDate: null,
  },
  {
    id: 'movie-tears-of-steel',
    title: 'Tears of Steel',
    slug: 'tears-of-steel',
    description:
      'In a cyberpunk future Amsterdam, a desperate team of resistance scientists and soldiers gathers inside the Oude Kerk dome to reenact a pivotal memory that could stop sentient machines from destroying Earth. Live-action VFX film by Blender Institute (CC-BY 3.0).',
    releaseYear: 2012,
    durationMinutes: 12,
    maturityRating: 'PG-13',
    language: 'English',
    country: 'Netherlands',
    subtitlesAvailable: ['en', 'fr', 'rw'],
    isFeatured: true,
    isTrending: true,
    isRwandanContent: false,
    isAfricanContent: false,
    isTop10: true,
    top10Rank: 3,
    viewCount: 21350,
    likeCount: 3120,
    averageRating: 4.7,
    state: 'PUBLISHED',
    posterUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Tears_of_Steel_poster.jpg',
    backdropUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/73/Tears_of_Steel_bridge.jpg',
    trailerUrl: OPEN_VIDEOS.tos,
    videoUrl: OPEN_VIDEOS.tos,
    genres: ['sci-fi', 'action', 'drama'],
    cast: ['Derek de Lint', 'Sergio Hasselbaink', 'Denise Rebergen', 'Vanja Rukavina'],
    rightsStatus: 'LICENSED',
    rightsHolder: 'Blender Foundation | Mango Open Movie Project (CC-BY 3.0)',
    licenseReference: 'CC-BY-3.0-BLENDER-TOS-2012',
    territories: ['GLOBAL', 'RW'],
    rightsEndDate: null,
  },
  {
    id: 'movie-elephants-dream',
    title: 'Elephants Dream',
    slug: 'elephants-dream',
    description:
      'Proog, a fiercely protective veteran explorer, guides young Emo through the surreal, ever-shifting clockwork labyrinth of a colossal telepathic machine that bends reality to their thoughts. The world’s first open-source 3D animated short film (CC-BY 2.5).',
    releaseYear: 2006,
    durationMinutes: 11,
    maturityRating: 'PG',
    language: 'English',
    country: 'Netherlands',
    subtitlesAvailable: ['en', 'fr'],
    isFeatured: false,
    isTrending: true,
    isRwandanContent: false,
    isAfricanContent: false,
    isTop10: true,
    top10Rank: 4,
    viewCount: 14780,
    likeCount: 1920,
    averageRating: 4.6,
    state: 'PUBLISHED',
    posterUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/0c/Elephants_Dream_poster_source.jpg',
    backdropUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Elephants_Dream_s5_both.jpg',
    trailerUrl: OPEN_VIDEOS.ed,
    videoUrl: OPEN_VIDEOS.ed,
    genres: ['animation', 'sci-fi', 'mystery'],
    cast: ['Tycho Gernandt', 'Cas Jansen', 'Bassam Kurdali', 'Ton Roosendaal'],
    rightsStatus: 'LICENSED',
    rightsHolder: 'Blender Foundation | Orange Open Movie Project (CC-BY 2.5)',
    licenseReference: 'CC-BY-2.5-BLENDER-ED-2006',
    territories: ['GLOBAL', 'RW'],
    rightsEndDate: null,
  },
  {
    id: 'movie-cosmos-laundromat',
    title: 'Cosmos Laundromat: First Cycle',
    slug: 'cosmos-laundromat',
    description:
      'On a desolate windswept island, suicidal sheep Franck meets a quirky salesman named Victor inside a mysterious laundromat who offers him the gift of many lifetimes across fantastical worlds. Produced by Blender Institute (CC-BY 4.0).',
    releaseYear: 2015,
    durationMinutes: 12,
    maturityRating: 'PG',
    language: 'English',
    country: 'Netherlands',
    subtitlesAvailable: ['en', 'fr', 'rw'],
    isFeatured: true,
    isTrending: false,
    isRwandanContent: false,
    isAfricanContent: false,
    isTop10: true,
    top10Rank: 5,
    viewCount: 16240,
    likeCount: 2340,
    averageRating: 4.8,
    state: 'PUBLISHED',
    posterUrl: createArtworkDataUrl('Cosmos Laundromat', 'BLENDER OPEN MOVIE • CC-BY 4.0', '#0f4c81', '#38bdf8', 600, 900),
    backdropUrl: createArtworkDataUrl('Cosmos Laundromat', 'BLENDER OPEN MOVIE • CC-BY 4.0', '#0f4c81', '#38bdf8', 1280, 720),
    trailerUrl: OPEN_VIDEOS.blazes,
    videoUrl: OPEN_VIDEOS.blazes,
    genres: ['animation', 'sci-fi', 'comedy', 'adventure'],
    cast: ['Pierre Bokma', 'Reinout Scholten van Aschat', 'Mathieu Auvray'],
    rightsStatus: 'LICENSED',
    rightsHolder: 'Blender Foundation | Gooseberry Open Movie Project (CC-BY 4.0)',
    licenseReference: 'CC-BY-4.0-BLENDER-COSMOS-2015',
    territories: ['GLOBAL', 'RW'],
    rightsEndDate: null,
  },
  {
    id: 'movie-kigali-horizon-demo',
    title: 'Kigali Horizon (Demo Submission)',
    slug: 'kigali-horizon-demo',
    description:
      'Sample East African filmmaker submission held in DRAFT state while licensing documentation is under review. Demonstrates how ZIRA prevents unverified uploads from being published to the public catalog until rights verification is completed.',
    releaseYear: 2026,
    durationMinutes: 14,
    maturityRating: 'PG-13',
    language: 'Kinyarwanda',
    country: 'Rwanda',
    subtitlesAvailable: ['en', 'rw', 'fr'],
    isFeatured: false,
    isTrending: false,
    isRwandanContent: true,
    isAfricanContent: true,
    isTop10: false,
    viewCount: 0,
    likeCount: 0,
    averageRating: 4.5,
    state: 'DRAFT',
    posterUrl: createArtworkDataUrl('Kigali Horizon', 'DEMO SUBMISSION • RIGHTS PENDING', '#7f1d1d', '#ef4444', 600, 900),
    backdropUrl: createArtworkDataUrl('Kigali Horizon', 'DEMO SUBMISSION • RIGHTS PENDING', '#7f1d1d', '#ef4444', 1280, 720),
    trailerUrl: OPEN_VIDEOS.escapes,
    videoUrl: OPEN_VIDEOS.escapes,
    genres: ['rwandan-cinema', 'drama', 'sci-fi'],
    cast: ['Demo Cast Showcase'],
    rightsStatus: 'PENDING_VERIFICATION',
    rightsHolder: 'Demo Filmmaker Submission (Unverified)',
    licenseReference: 'PENDING-RIGHTS-REVIEW-DEMO',
    territories: ['RW'],
    rightsEndDate: null,
  },
];

/**
 * Slugs from the previous 32-movie fictional seed list so `seedDatabase()` can clean up
 * obsolete fictional demo records without touching user-uploaded movies.
 */
export const LEGACY_REMOVED_MOVIE_SLUGS: string[] = [
  'dawn-of-a-thousand-hills',
  'kigali-horizon',
  'the-alexandria-cipher',
  'eclipse-over-karongi',
  'joburg-deep-underground-beats',
  'above-the-mist-nyungwe-canopy',
  'spring-the-ancient-grove',
  'gold-coast-gambit',
  'letters-from-rubavu',
  'cosmos-laundromat-first-cycle',
  'chasing-the-yellow-jersey-tour-du-rwanda',
  'house-of-the-crimson-drum',
  'silicon-savannah-architects-of-tomorrow',
  'the-archivist-of-huye',
  'dakar-sandstorm',
  'red-glow-of-the-caldera',
  'brochette-bosses',
  'kibo-orbital-elevator-to-the-stars',
  'night-bus-to-kampala',
  'the-whispering-forest-of-gishwati',
  'moonlight-over-stone-town',
  'a-wedding-in-musanze',
  'thunder-over-akagera',
  'elephants-dream-machine-labyrinth',
  'the-lake-kivu-signal',
  'big-buck-bunny-open-animation',
  'the-victoria-island-protocol',
  'nairobi-velocity',
  'guardians-of-virunga',
  'nyamirambo-nights',
  'sintel-the-dragon-quest',
  'tears-of-steel-open-movie',
];

export const LEGACY_REMOVED_SERIES_SLUGS: string[] = [
  'the-kigali-chronicles',
  'semester-in-huye',
  'kingdoms-of-the-great-lakes',
  'altitude-5895-alpine-rescue',
  'hearts-in-nyarutarama',
  'chambers-of-marina',
  'whispers-around-the-fire',
  'open-cinema-studio-anthology',
  'flavors-of-the-great-lakes',
  'cafe-kivu',
  'neo-alkebu-2099',
  'rangers-of-the-rift',
];

export const SEED_SERIES: SeedSeries[] = [
  {
    id: 'series-blender-open-cinema',
    title: 'Blender Open Movie Anthology',
    slug: 'blender-open-movie-anthology',
    description:
      'Curated collection of Creative Commons open-source short films and behind-the-scenes production reels released by the Blender Foundation.',
    releaseYear: 2024,
    maturityRating: 'PG',
    language: 'English',
    isFeatured: true,
    isTrending: true,
    isRwandanContent: false,
    isAfricanContent: false,
    isTop10: true,
    top10Rank: 1,
    viewCount: 19400,
    averageRating: 4.9,
    state: 'PUBLISHED',
    posterUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8f/Sintel_poster.jpg',
    backdropUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b2/Sintel_wallpaper_dragon.jpg',
    trailerUrl: OPEN_VIDEOS.sintel,
    genres: ['animation', 'sci-fi', 'fantasy'],
    cast: ['Blender Studio Ensemble'],
    rightsStatus: 'PUBLIC_DOMAIN',
    rightsHolder: 'Blender Foundation (CC-BY 3.0)',
    licenseReference: 'CC-BY-3.0-BLENDER-ANTHOLOGY',
    seasons: [
      {
        id: 'season-blender-open-cinema-s1',
        seasonNumber: 1,
        title: 'Season 1: Open Animation Milestones',
        description: 'Landmark open-licensed animated shorts from Blender Studio.',
        episodes: [
          {
            id: 'ep-blender-s1-e1',
            episodeNumber: 1,
            title: 'Elephants Dream (2006)',
            description: 'The pioneering open-movie journey inside a surreal clockwork machine.',
            durationMinutes: 11,
            thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Elephants_Dream_s5_both.jpg',
            videoUrl: OPEN_VIDEOS.ed,
            state: 'PUBLISHED',
          },
          {
            id: 'ep-blender-s1-e2',
            episodeNumber: 2,
            title: 'Big Buck Bunny (2008)',
            description: 'Open-licensed forest comedy classic created in Blender.',
            durationMinutes: 10,
            thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Big.Buck.Bunny.-.Opening.Screen.png',
            videoUrl: OPEN_VIDEOS.bbb,
            state: 'PUBLISHED',
          },
          {
            id: 'ep-blender-s1-e3',
            episodeNumber: 3,
            title: 'Sintel (2010)',
            description: 'Epic fantasy short film following Sintel and her dragon companion Scales.',
            durationMinutes: 15,
            thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b2/Sintel_wallpaper_dragon.jpg',
            videoUrl: OPEN_VIDEOS.sintel,
            state: 'PUBLISHED',
          },
          {
            id: 'ep-blender-s1-e4',
            episodeNumber: 4,
            title: 'Tears of Steel (2012)',
            description: 'Live-action and visual effects sci-fi short shot in Amsterdam.',
            durationMinutes: 12,
            thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/73/Tears_of_Steel_bridge.jpg',
            videoUrl: OPEN_VIDEOS.tos,
            state: 'PUBLISHED',
          },
        ],
      },
    ],
  },
  {
    id: 'series-rwandan-creator-showcase',
    title: 'Rwanda Open Media Showcase (Demo Series)',
    slug: 'rwanda-open-media-showcase',
    description:
      'Demonstration series illustrating multi-episode East African episodic streaming, season management, and open-licensed playback on ZIRA.',
    releaseYear: 2025,
    maturityRating: 'G',
    language: 'Kinyarwanda',
    isFeatured: true,
    isTrending: true,
    isRwandanContent: true,
    isAfricanContent: true,
    isTop10: true,
    top10Rank: 2,
    viewCount: 12800,
    averageRating: 4.8,
    state: 'PUBLISHED',
    posterUrl: createArtworkDataUrl('Rwanda Media Showcase', 'DEMO SERIES • OPEN STREAM', '#065f46', '#10b981', 600, 900),
    backdropUrl: createArtworkDataUrl('Rwanda Media Showcase', 'DEMO SERIES • OPEN STREAM', '#065f46', '#10b981', 1280, 720),
    trailerUrl: OPEN_VIDEOS.bbb,
    genres: ['rwandan-cinema', 'documentary', 'family'],
    cast: ['ZIRA Open Media Collective'],
    rightsStatus: 'PUBLIC_DOMAIN',
    rightsHolder: 'ZIRA Open Demo Catalog (CC-BY)',
    licenseReference: 'ZIRA-DEMO-SERIES-CC-BY',
    seasons: [
      {
        id: 'season-rwanda-showcase-s1',
        seasonNumber: 1,
        title: 'Season 1: Open Streaming Reels',
        description: 'Open-licensed sample episodes for testing episodic playback and progress tracking.',
        episodes: [
          {
            id: 'ep-rwanda-s1-e1',
            episodeNumber: 1,
            title: 'Episode 1: Open Forest Reel',
            description: 'Open-licensed HD test stream for adaptive playback verification.',
            durationMinutes: 10,
            thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Big.Buck.Bunny.-.Opening.Screen.png',
            videoUrl: OPEN_VIDEOS.bbb,
            state: 'PUBLISHED',
          },
          {
            id: 'ep-rwanda-s1-e2',
            episodeNumber: 2,
            title: 'Episode 2: Highland Quest Reel',
            description: 'Second episodic test stream demonstrating next-episode transitions.',
            durationMinutes: 15,
            thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b2/Sintel_wallpaper_dragon.jpg',
            videoUrl: OPEN_VIDEOS.sintel,
            state: 'PUBLISHED',
          },
        ],
      },
    ],
  },
];
