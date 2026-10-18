
import fs from 'node:fs';
import path from 'node:path';
import pool from './db-mysql.js';

const dataPath = path.resolve(
  process.cwd(),
  'backend/data/spendwise_data.json'
);

async function main() {
  if (!fs.existsSync(dataPath)) {
    throw new Error(`JSON data file not found: ${dataPath}`);
  }

  const rawData = JSON.parse(
    fs.readFileSync(dataPath, 'utf8')
  );

  console.log('JSON data file found.');
  console.log(
    'Collections:',
    Object.keys(rawData).join(', ')
  );

  console.log(
    'Record counts:',
    Object.fromEntries(
      Object.entries(rawData).map(([key, value]) => [
        key,
        Array.isArray(value) ? value.length : 'not an array',
      ])
    )
  );

  await pool.end();
}

main().catch(async (error) => {
  console.error('Migration preparation failed:', error.message);
  await pool.end();
  process.exitCode = 1;
});
