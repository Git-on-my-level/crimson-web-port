import { cp, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';

const projectRoot = process.cwd();
const useReal = process.env.REAL_ASSETS === '1';
const fakeDir = path.join(projectRoot, 'assets_fake');
const realDir = path.join(projectRoot, 'ignored_assets');
const destDir = path.join(projectRoot, 'public', 'assets');

const exists = async (target) => {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
};

const realExists = await exists(realDir);
const sourceDir = useReal && realExists ? realDir : fakeDir;
const sourceLabel = sourceDir === realDir ? 'ignored_assets' : 'assets_fake';

if (useReal && !realExists) {
  console.warn('[assets] REAL_ASSETS=1 but ignored_assets not found; falling back to assets_fake.');
}

if (!(await exists(sourceDir))) {
  console.warn(`[assets] ${sourceLabel} not found, skipping copy.`);
  process.exit(0);
}

await mkdir(destDir, { recursive: true });
await cp(sourceDir, destDir, {
  recursive: true,
  force: true,
  filter: (src) => !src.endsWith('.DS_Store') && !src.endsWith(path.sep + '.gitignore'),
});

console.log(`[assets] Copied ${sourceLabel} -> ${path.relative(projectRoot, destDir)}`);
