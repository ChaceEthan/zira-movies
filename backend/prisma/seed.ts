import prisma from './prisma';

async function main() {
  const genres = [
    { name: 'Demo Drama', slug: 'demo-drama' },
    { name: 'Demo Adventure', slug: 'demo-adventure' },
  ];

  for (const genre of genres) {
    await prisma.genre.upsert({ where: { slug: genre.slug }, update: {}, create: genre });
  }

  await prisma.movie.upsert({
    where: { slug: 'the-lantern-keeper-demo' },
    update: {},
    create: {
      title: 'The Lantern Keeper (Demo)',
      slug: 'the-lantern-keeper-demo',
      description: 'A fictional catalog record for local development. No film or distribution rights are represented.',
      releaseYear: 2025,
      durationMinutes: 92,
      language: 'English',
      subtitlesAvailable: [],
      state: 'DRAFT',
      movieGenres: { create: [{ genre: { connect: { slug: 'demo-drama' } } }] },
      contentRights: {
        create: {
          rightsStatus: 'PENDING_VERIFICATION',
          rightsHolder: 'Fictional development record; no rights asserted',
          rightsStartDate: new Date(),
        },
      },
    },
  });

  await prisma.series.upsert({
    where: { slug: 'river-of-stars-demo' },
    update: {},
    create: {
      title: 'River of Stars (Demo)',
      slug: 'river-of-stars-demo',
      description: 'A fictional series record for local development. It contains no playable video.',
      releaseYear: 2026,
      state: 'DRAFT',
      seriesGenres: { create: [{ genre: { connect: { slug: 'demo-adventure' } } }] },
      contentRights: {
        create: {
          rightsStatus: 'PENDING_VERIFICATION',
          rightsHolder: 'Fictional development record; no rights asserted',
          rightsStartDate: new Date(),
        },
      },
    },
  });
}

main()
  .catch(error => {
    console.error('Development seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());