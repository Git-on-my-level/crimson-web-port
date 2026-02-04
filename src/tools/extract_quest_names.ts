import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';

interface QuestInfo {
  id: string;
  title: string;
  address: string;
  index: number;
}

function extractQuestNames(filePath: string): QuestInfo[] {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const quests: QuestInfo[] = [];
  let questIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^\/\*\s+quest_build_([a-zA-Z0-9_]+)\s+@\s+([0-9a-fA-F]+)\s+\*\/$/);
    
    if (match) {
      const rawName = match[1];
      const address = match[2];
      
      const id = rawName.toLowerCase();
      const title = rawName
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      quests.push({ id, title, address, index: questIndex });
      questIndex++;
    }
  }

  return quests.sort((a, b) => a.index - b.index);
}

function ensureDir(filePath: string): void {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function main() {
  const rootDir = process.cwd();
  const refDir = join(rootDir, '.codex-autorunner', 'workspace', 'crimson-master', 'analysis', 'ghidra', 'raw');
  const docsRefDir = join(rootDir, 'docs', 'ref');
  const contentQuestsDir = join(rootDir, 'src', 'content', 'quests');

  ensureDir(docsRefDir);
  ensureDir(contentQuestsDir);

  const crimsonlandPath = join(refDir, 'crimsonland.exe_decompiled.c');
  const quests = extractQuestNames(crimsonlandPath);

  const questListContent = `# Quest List

Extracted from \`crimsonland.exe_decompiled.c\` quest builder functions.

## All Quests (${quests.length})

| Index | Quest ID | Title | Address |
|-------|----------|-------|---------|
${quests.map(q => `| ${q.index} | \`${q.id}\` | ${q.title} | ${q.address} |`).join('\n')}

## Quest IDs (for reference)

\`\`\`typescript
export const QUEST_IDS = [
${quests.map(q => `  '${q.id}',`).join('\n')}
] as const;
\`\`\`

---

**Generated:** ${new Date().toISOString()}
**Source:** ${crimsonlandPath}
`;

  writeFileSync(join(docsRefDir, 'quest-list.md'), questListContent);

  const questIdsContent = `export const QUEST_IDS = [
${quests.map(q => `  '${q.id}',`).join('\n')}
] as const;

export type QuestId = typeof QUEST_IDS[number];

export const QUEST_TITLES: Record<QuestId, string> = {
${quests.map(q => `  '${q.id}': '${q.title}',`).join('\n')}
};

export function getQuestTitle(id: QuestId): string {
  return QUEST_TITLES[id] ?? id;
}
`;

  writeFileSync(join(contentQuestsDir, 'quest_ids.ts'), questIdsContent);

  console.log(`✓ Extracted ${quests.length} quests from reference`);
  console.log(`✓ Generated docs/ref/quest-list.md`);
  console.log(`✓ Generated src/content/quests/quest_ids.ts`);
}

main();
