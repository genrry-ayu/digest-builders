#!/usr/bin/env node
// Link the existing local automation entry points to this checkout. No scheduling.
import { mkdir, lstat, readlink, rename, symlink } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const automation = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const root = process.env.DIGEST_BUSINESS_ROOT || join(homedir(), 'business-automations');
const backup = join(root, 'runs', `install-backup-${new Date().toISOString().replaceAll(':', '-')}`);
const links = [
  [join(root, 'source/scripts/digest-static-publisher.mjs'), join(automation, 'scripts/digest-static-publisher.mjs')],
  [join(root, 'source/scripts/digest-articles.md'), join(automation, 'scripts/digest-articles.md')],
  [join(root, 'source/skills/follow-builders'), join(automation, 'skills/follow-builders')],
  [join(root, 'verify-digest.mjs'), join(automation, 'scripts/verify-digest.mjs')],
  ...['digest-intro', 'summarize-podcast', 'summarize-blogs', 'summarize-tweets', 'translate'].map(name => [
    join(homedir(), '.follow-builders/prompts', `${name}.md`),
    join(automation, 'skills/follow-builders/prompts', `${name}.md`),
  ]),
];

for (const [destination, source] of links) {
  const stat = await lstat(destination).catch(error => { if (error.code !== 'ENOENT') throw error; return null; });
  if (stat?.isSymbolicLink() && resolve(dirname(destination), await readlink(destination)) === source) continue;
  if (process.argv.includes('--check')) throw new Error(`Local entry point is not linked: ${destination}`);
  if (stat) {
    await mkdir(backup, { recursive: true });
    await rename(destination, join(backup, destination.replaceAll('/', '__')));
  }
  await mkdir(dirname(destination), { recursive: true });
  await symlink(source, destination);
  console.log(`Linked ${destination}`);
}
console.log('Local entry points and all 5 prompt overrides match this checkout. Schedule unchanged.');
