import { appendFile } from 'node:fs/promises';
import console from 'node:console';
import process from 'node:process';
import { URL } from 'node:url';
import pg from 'pg';

const databaseNames = {
  INQUIRY_TEST_DATABASE_URL: 'cod318_inquiry_test',
  INQUIRY_ADMIN_TEST_DATABASE_URL: 'cod318_inquiry_admin_test',
  INQUIRY_LIFECYCLE_TEST_DATABASE_URL: 'cod318_lifecycle_test',
  CONTENT_TEST_DATABASE_URL: 'cod316_content_repo_m1_test',
  PUBLIC_CONTENT_TEST_DATABASE_URL: 'cod316_public_content_test',
  ADMIN_CONTENT_TEST_DATABASE_URL: 'cod316_m3_review_test',
  MEDIA_TEST_DATABASE_URL: 'cod317_media_test',
  ARTICLES_M4_TEST_DATABASE_URL: 'cod316_articles_m4_test',
  PUBLICATION_M5_TEST_DATABASE_URL: 'cod316_publication_m5_test',
  CONTENT_M6_TEST_DATABASE_URL: 'cod316_content_m6_test',
  READINESS_TEST_DATABASE_URL: 'cod319_readiness_test',
};

async function main() {
  let url;
  try {
    url = new URL(process.env.TEST_DATABASE_URL);
  } catch {
    throw new Error('Refusing non-disposable test database.');
  }
  if (
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
    decodeURIComponent(url.pathname) !== '/codeddevs_test'
  ) {
    throw new Error('Refusing non-disposable test database.');
  }

  const administrationUrl = new URL(url);
  administrationUrl.pathname = '/postgres';
  const client = new pg.Client({
    connectionString: administrationUrl.toString(),
  });
  try {
    await client.connect();
    for (const databaseName of Object.values(databaseNames)) {
      await client.query(`CREATE DATABASE "${databaseName}"`);
    }
  } finally {
    await client.end().catch(() => undefined);
  }

  if (process.env.GITHUB_ENV) {
    const lines = Object.entries(databaseNames).map(
      ([variable, databaseName]) => {
        const databaseUrl = new URL(url);
        databaseUrl.pathname = `/${databaseName}`;
        return `${variable}=${databaseUrl.toString()}`;
      },
    );
    await appendFile(process.env.GITHUB_ENV, `${lines.join('\n')}\n`);
  }
  console.log(
    `Created ${Object.keys(databaseNames).length} disposable test databases.`,
  );
}

main().catch((error) => {
  console.error(
    error?.message === 'Refusing non-disposable test database.'
      ? error.message
      : 'Could not create disposable test databases.',
  );
  process.exitCode = 1;
});
