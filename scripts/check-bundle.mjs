import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const FORBIDDEN = 'chubb.test';
const defaultDir = 'dist/chubb-claims-frontend';

function listFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

export function checkBundle(dir) {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    return { code: 1, messages: ['dist/ not found, run npm run build first'] };
  }
  const files = listFiles(dir);
  if (!files.some((file) => file.endsWith('.js'))) {
    return { code: 1, messages: ['dist/ contains no JS bundles, run npm run build first'] };
  }
  const offenders = files.filter((file) => readFileSync(file, 'utf8').includes(FORBIDDEN));
  if (offenders.length > 0) {
    return { code: 1, messages: offenders };
  }
  return { code: 0, messages: [] };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { code, messages } = checkBundle(process.argv[2] ?? defaultDir);
  messages.forEach((message) => process.stderr.write(`${message}\n`));
  process.exit(code);
}
