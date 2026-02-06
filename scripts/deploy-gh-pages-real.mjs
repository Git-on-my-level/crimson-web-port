import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const projectRoot = process.cwd();

const run = (cmd, opts = {}) => execSync(cmd, { stdio: 'inherit', ...opts });
const runOut = (cmd, opts = {}) => execSync(cmd, { stdio: 'pipe', encoding: 'utf8', ...opts }).trim();

const ensureTrailingSlash = (value) => (value.endsWith('/') ? value : `${value}/`);
const ensureLeadingSlash = (value) => (value.startsWith('/') ? value : `/${value}`);

const parseRepoName = (remoteUrl) => {
  if (!remoteUrl) return null;
  const cleaned = remoteUrl.replace(/\.git$/, '');
  const match = cleaned.match(/[:/](?<name>[^/]+)$/);
  return match?.groups?.name ?? null;
};

const getBasePath = async () => {
  if (process.env.BASE_PATH) return ensureTrailingSlash(process.env.BASE_PATH);
  let repoName = null;
  try {
    repoName = parseRepoName(runOut('git config --get remote.origin.url'));
  } catch {
    repoName = null;
  }
  if (!repoName) {
    try {
      const pkg = JSON.parse(await fs.readFile(path.join(projectRoot, 'package.json'), 'utf8'));
      repoName = typeof pkg.name === 'string' ? pkg.name : null;
    } catch {
      repoName = null;
    }
  }
  if (!repoName) {
    throw new Error('Unable to resolve BASE_PATH. Set BASE_PATH explicitly.');
  }
  return ensureTrailingSlash(ensureLeadingSlash(repoName));
};

const getWorktreeDir = () => path.join(os.tmpdir(), 'crimson-gh-pages');

const listWorktrees = () => runOut('git worktree list --porcelain');

const worktreeExists = (worktreeDir, worktreesText) =>
  worktreesText
    .split('\n')
    .some((line) => line.startsWith('worktree ') && line.slice('worktree '.length) === worktreeDir);

const emptyDirExceptGit = async (dir) => {
  const entries = await fs.readdir(dir);
  await Promise.all(
    entries
      .filter((entry) => entry !== '.git')
      .map((entry) => fs.rm(path.join(dir, entry), { recursive: true, force: true })),
  );
};

const copyDirContents = async (srcDir, destDir) => {
  const entries = await fs.readdir(srcDir);
  await Promise.all(
    entries.map((entry) =>
      fs.cp(path.join(srcDir, entry), path.join(destDir, entry), { recursive: true }),
    ),
  );
};

const main = async () => {
  const basePath = await getBasePath();
  const worktreeDir = getWorktreeDir();
  const distDir = path.join(projectRoot, 'dist');

  console.log(`[deploy] base path: ${basePath}`);
  run(`BASE_PATH="${basePath}" REAL_ASSETS=1 VITE_USE_REAL_ASSETS=1 npm run build:real`, {
    cwd: projectRoot,
  });

  const worktreesText = listWorktrees();
  if (!worktreeExists(worktreeDir, worktreesText)) {
    run(`git worktree add -B gh-pages ${worktreeDir}`, { cwd: projectRoot });
  }

  await emptyDirExceptGit(worktreeDir);
  await copyDirContents(distDir, worktreeDir);

  run('git add -A', { cwd: worktreeDir });
  const status = runOut('git status --porcelain', { cwd: worktreeDir });
  if (!status) {
    console.log('[deploy] No changes to publish.');
    return;
  }
  run('git commit -m "Deploy"', { cwd: worktreeDir });
  run('git push origin gh-pages', { cwd: worktreeDir });
};

main().catch((err) => {
  console.error(`[deploy] Failed: ${err.message}`);
  process.exit(1);
});
