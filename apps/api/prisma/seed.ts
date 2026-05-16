/**
 * Seed la BDD avec les 471 films de la watchlist.
 * Idempotent : utilise upsert sur la clé unique (title + year).
 *
 *   pnpm --filter @cinepass/api db:seed
 *   make db-seed
 */
import { PrismaClient } from '@prisma/client';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, 'data', 'films.json');

interface SeedFilm {
  title: string;
  year: number;
  director: string;
  ageBracket: string;
}

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const raw = await readFile(DATA_PATH, 'utf-8');
  const films = JSON.parse(raw) as SeedFilm[];

  console.log(`Seeding ${films.length} films from ${DATA_PATH}...`);

  let inserted = 0;
  let updated = 0;
  for (const f of films) {
    const result = await prisma.film.upsert({
      where: { title_year: { title: f.title, year: f.year } },
      update: {
        director: f.director,
        ageBracket: f.ageBracket,
      },
      create: {
        title: f.title,
        year: f.year,
        director: f.director,
        ageBracket: f.ageBracket,
      },
    });
    if (result.createdAt.getTime() === result.updatedAt.getTime()) {
      inserted += 1;
    } else {
      updated += 1;
    }
  }

  console.log(`Done. Inserted: ${inserted}, Updated: ${updated}`);
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
