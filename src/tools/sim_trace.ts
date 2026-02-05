import fs from 'node:fs';
import path from 'node:path';
import { Sim } from '../sim/sim';
import type { InputFrame, SimEvent } from '../sim/types';
import { EMPTY_INPUT } from '../sim/types';
import type { SimState } from '../sim/state';

const DEFAULT_TICKS = 600;
const DEFAULT_SNAPSHOT_INTERVAL = 60;

type TraceOptions = {
  seed: number;
  ticks: number;
  snapshotInterval: number | null;
  snapshotTicks: number[];
  mode?: SimState['mode'];
  questId?: SimState['selectedQuestId'];
  inputFile?: string;
  pattern: 'idle' | 'constant-fire' | 'zigzag';
  outFile?: string;
};

type TraceSnapshot = {
  tick: number;
  timeAlive: number;
  phase: SimState['phase'];
  mode: SimState['mode'];
  score: number;
  player: {
    hp: number;
    hpMax: number;
    level: number;
    xp: number;
    xpToNext: number;
    weaponId: string;
    ammo: number;
    reloadTimer: number;
    shotCooldown: number;
    spreadHeat: number;
    pos: { x: number; y: number };
    aimAngle: number;
    activeEffects: Record<string, number>;
    perks: Record<string, number>;
    perkStats: SimState['player']['perkStats'];
  };
  counts: {
    creatures: number;
    projectiles: number;
    bonuses: number;
  };
  modeState:
    | {
        kind: 'survival';
        elapsedMs: number;
        spawnCooldownMs: number;
        spawnMinDistance: number;
        spawnMaxDistance: number;
      }
    | {
        kind: 'quest';
        elapsedTicks: number;
        status: string;
        killsTotal: number;
        nextTimelineIndex: number;
      };
};

type EventSummary = {
  tick: number;
  counts: Record<string, number>;
  spawnCreatures?: Record<string, number>;
  spawnProjectiles?: Record<string, number>;
  spawnBonuses?: Record<string, number>;
  damage?: { player: number; creatures: number; total: number };
  pickups?: string[];
  perkOffered?: Array<{ level: number; choices: string[] }>;
  perkChosen?: Array<{ perkId: string; level: number }>;
  levelUps?: Array<{ level: number; xpToNext: number }>;
  questStatus?: string[];
  questMessages?: string[];
  sfx?: string[];
};

function parseArgs(argv: string[]): TraceOptions {
  const options: TraceOptions = {
    seed: 1,
    ticks: DEFAULT_TICKS,
    snapshotInterval: DEFAULT_SNAPSHOT_INTERVAL,
    snapshotTicks: [],
    pattern: 'idle',
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) {
      continue;
    }
    const key = arg.slice(2);
    const next = argv[i + 1];
    switch (key) {
      case 'seed':
        options.seed = Number(next ?? options.seed);
        i += 1;
        break;
      case 'ticks':
        options.ticks = Number(next ?? options.ticks);
        i += 1;
        break;
      case 'snapshot':
        options.snapshotInterval = next ? Number(next) : options.snapshotInterval;
        i += 1;
        break;
      case 'snapshot-at':
        if (next) {
          options.snapshotTicks = next
            .split(',')
            .map((value) => Number(value.trim()))
            .filter((value) => Number.isFinite(value));
        }
        i += 1;
        break;
      case 'mode':
        if (next === 'survival' || next === 'quest') {
          options.mode = next;
        }
        i += 1;
        break;
      case 'quest':
        if (next) {
          options.questId = next as SimState['selectedQuestId'];
        }
        i += 1;
        break;
      case 'input':
        if (next) {
          options.inputFile = next;
        }
        i += 1;
        break;
      case 'pattern':
        if (next === 'idle' || next === 'constant-fire' || next === 'zigzag') {
          options.pattern = next;
        }
        i += 1;
        break;
      case 'out':
        if (next) {
          options.outFile = next;
        }
        i += 1;
        break;
      case 'no-snapshot':
        options.snapshotInterval = null;
        break;
      default:
        break;
    }
  }

  if (!Number.isFinite(options.seed)) {
    options.seed = 1;
  }
  if (!Number.isFinite(options.ticks) || options.ticks <= 0) {
    options.ticks = DEFAULT_TICKS;
  }
  if (options.snapshotInterval !== null && (!Number.isFinite(options.snapshotInterval) || options.snapshotInterval <= 0)) {
    options.snapshotInterval = DEFAULT_SNAPSHOT_INTERVAL;
  }

  return options;
}

function loadInputFrames(inputFile?: string): InputFrame[] | null {
  if (!inputFile) {
    return null;
  }
  const resolved = path.resolve(process.cwd(), inputFile);
  const raw = fs.readFileSync(resolved, 'utf-8');
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) {
    return parsed as InputFrame[];
  }
  if (parsed && Array.isArray(parsed.frames)) {
    return parsed.frames as InputFrame[];
  }
  return null;
}

function buildPatternInput(pattern: TraceOptions['pattern'], tick: number): InputFrame {
  switch (pattern) {
    case 'constant-fire':
      return {
        ...EMPTY_INPUT,
        aimX: 1,
        aimY: 0,
        fire: true,
      };
    case 'zigzag':
      return {
        ...EMPTY_INPUT,
        moveX: tick % 120 < 60 ? 1 : -1,
        aimX: 1,
        aimY: 0,
        fire: tick % 15 === 0,
      };
    case 'idle':
    default:
      return { ...EMPTY_INPUT };
  }
}

function getInputSource(options: TraceOptions): (tick: number) => InputFrame {
  const frames = loadInputFrames(options.inputFile);
  if (frames && frames.length > 0) {
    return (tick) => frames[tick] ?? frames[frames.length - 1] ?? { ...EMPTY_INPUT };
  }
  return (tick) => buildPatternInput(options.pattern, tick);
}

function summarizeEvents(tick: number, events: SimEvent[]): EventSummary {
  const summary: EventSummary = {
    tick,
    counts: {},
  };

  for (const event of events) {
    summary.counts[event.type] = (summary.counts[event.type] ?? 0) + 1;
    switch (event.type) {
      case 'spawnCreature':
        summary.spawnCreatures ??= {};
        summary.spawnCreatures[event.kind] = (summary.spawnCreatures[event.kind] ?? 0) + 1;
        break;
      case 'spawnProjectile':
        summary.spawnProjectiles ??= {};
        summary.spawnProjectiles[event.kind] = (summary.spawnProjectiles[event.kind] ?? 0) + 1;
        break;
      case 'spawnBonus':
        summary.spawnBonuses ??= {};
        summary.spawnBonuses[event.kind] = (summary.spawnBonuses[event.kind] ?? 0) + 1;
        break;
      case 'damage':
        summary.damage ??= { player: 0, creatures: 0, total: 0 };
        if (event.target === 'player') {
          summary.damage.player += event.amount;
        } else {
          summary.damage.creatures += event.amount;
        }
        summary.damage.total += event.amount;
        break;
      case 'pickup':
        summary.pickups ??= [];
        summary.pickups.push(event.bonusType);
        break;
      case 'perkOffered':
        summary.perkOffered ??= [];
        summary.perkOffered.push({ level: event.level, choices: [...event.choices] });
        break;
      case 'perkChosen':
        summary.perkChosen ??= [];
        summary.perkChosen.push({ perkId: event.perkId, level: event.level });
        break;
      case 'levelUp':
        summary.levelUps ??= [];
        summary.levelUps.push({ level: event.level, xpToNext: event.xpToNext });
        break;
      case 'questStatusChanged':
        summary.questStatus ??= [];
        summary.questStatus.push(event.status);
        break;
      case 'questMessage':
        summary.questMessages ??= [];
        summary.questMessages.push(event.text);
        break;
      case 'playSfx':
        summary.sfx ??= [];
        summary.sfx.push(event.name);
        break;
      default:
        break;
    }
  }

  return summary;
}

function buildSnapshot(state: SimState): TraceSnapshot {
  const activeEffects: Record<string, number> = {};
  for (const [key, value] of Object.entries(state.player.activeEffects)) {
    activeEffects[key] = value ?? 0;
  }
  const perks: Record<string, number> = {};
  for (const [key, value] of Object.entries(state.player.perks)) {
    perks[key] = value ?? 0;
  }

  const snapshot: TraceSnapshot = {
    tick: state.tick,
    timeAlive: state.timeAlive,
    phase: state.phase,
    mode: state.mode,
    score: state.score,
    player: {
      hp: state.player.hp,
      hpMax: state.player.hpMax,
      level: state.player.level,
      xp: state.player.xp,
      xpToNext: state.player.xpToNext,
      weaponId: state.player.weaponId,
      ammo: state.player.ammo,
      reloadTimer: state.player.reloadTimer,
      shotCooldown: state.player.shotCooldown,
      spreadHeat: state.player.spreadHeat,
      pos: { x: state.player.pos.x, y: state.player.pos.y },
      aimAngle: state.player.aimAngle,
      activeEffects,
      perks,
      perkStats: { ...state.player.perkStats },
    },
    counts: {
      creatures: state.creatures.length,
      projectiles: state.projectiles.length,
      bonuses: state.bonuses.length,
    },
    modeState:
      state.modeState.kind === 'survival'
        ? {
            kind: 'survival',
            elapsedMs: Number(state.modeState.elapsedMs.toFixed(2)),
            spawnCooldownMs: Number(state.modeState.spawnCooldownMs.toFixed(2)),
            spawnMinDistance: state.modeState.spawnMinDistance,
            spawnMaxDistance: state.modeState.spawnMaxDistance,
          }
        : {
            kind: 'quest',
            elapsedTicks: state.modeState.elapsedTicks,
            status: state.modeState.status,
            killsTotal: state.modeState.killsTotal,
            nextTimelineIndex: state.modeState.nextTimelineIndex,
          },
  };

  return snapshot;
}

function main(): void {
  const options = parseArgs(process.argv.slice(2));
  const sim = new Sim({ seed: options.seed, mode: options.mode, questId: options.questId });
  const inputSource = getInputSource(options);

  const snapshotTicks = new Set<number>(options.snapshotTicks);
  if (options.snapshotInterval !== null) {
    for (let tick = 0; tick <= options.ticks; tick += options.snapshotInterval) {
      snapshotTicks.add(tick);
    }
  }

  const snapshots: TraceSnapshot[] = [];
  const eventsByTick: EventSummary[] = [];

  if (snapshotTicks.has(0)) {
    snapshots.push(buildSnapshot(sim.state));
  }

  for (let tick = 0; tick < options.ticks; tick += 1) {
    const input = inputSource(tick);
    const result = sim.step(input);
    eventsByTick.push(summarizeEvents(sim.state.tick, result.events));
    if (snapshotTicks.has(sim.state.tick)) {
      snapshots.push(buildSnapshot(sim.state));
    }
  }

  const report = {
    meta: {
      seed: options.seed,
      ticks: options.ticks,
      mode: sim.state.mode,
      questId: sim.state.selectedQuestId,
      snapshotInterval: options.snapshotInterval,
      snapshotTicks: Array.from(snapshotTicks.values()).sort((a, b) => a - b),
      input: options.inputFile ? path.resolve(process.cwd(), options.inputFile) : null,
      pattern: options.inputFile ? null : options.pattern,
    },
    snapshots,
    events: eventsByTick,
  };

  const output = JSON.stringify(report, null, 2);
  if (options.outFile) {
    const resolved = path.resolve(process.cwd(), options.outFile);
    fs.writeFileSync(resolved, output, 'utf-8');
    process.stdout.write(`${resolved}\n`);
  } else {
    process.stdout.write(output + '\n');
  }
}

main();
