import { WEAPONS, type WeaponId } from '../content/weapons';
import { DEFAULT_QUEST_ID, type QuestId, type QuestSpawnPattern, type QuestStatus } from '../content/quests';
import { type BonusId } from '../content/bonuses';
import { EMPTY_INPUT, type InputFrame, type Vec2, vec2 } from './types';
import { createPerkStats, type PerkStats } from './perks';
import type { PerkId } from '../content/perks';
import { Rng } from './rng';
import { ObjectPool } from './pool';
import { refreshAvailableWeapons } from './weapons/weaponTable';
import { xpToNextForLevel } from './xp';

export interface PlayerState {
  id: number;
  pos: Vec2;
  vel: Vec2;
  radius: number;
  hp: number;
  hpMax: number;
  baseHpMax: number;
  aimDir: Vec2;
  aimAngle: number;
  fireCooldownTicks: number;
  weaponId: WeaponId;
  ammo: number;
  reloadTicksRemaining: number;
  input: InputFrame;
  baseSpeed: number;
  activeEffects: Partial<Record<BonusId, number>>;
  level: number;
  xp: number;
  xpToNext: number;
  perks: Partial<Record<PerkId, number>>;
  perkStats: PerkStats;
  unlockedWeapons: Set<WeaponId>;
  availableWeapons: WeaponId[];
}

export interface CreatureState {
  id: number;
  pos: Vec2;
  vel: Vec2;
  hp: number;
  hpMax: number;
  radius: number;
  speed: number;
  touchDamage: number;
  touchCooldownTicks: number;
  alive: boolean;
  kind: string;
}

export interface ProjectileState {
  id: number;
  pos: Vec2;
  vel: Vec2;
  alive: boolean;
  radius: number;
  damage: number;
  lifeTicksRemaining: number;
  owner: 'player' | 'creature';
  kind: string;
  pierceRemaining: number;
  explosionRadius: number;
  explosionDamage: number;
}

export interface BonusState {
  id: number;
  pos: Vec2;
  active: boolean;
  kind: BonusId;
  radius: number;
  lifeTicksRemaining: number;
}

export interface SimState {
  tick: number;
  rng: Rng;
  player: PlayerState;
  creatures: CreatureState[];
  projectiles: ProjectileState[];
  bonuses: BonusState[];
  score: number;
  timeAlive: number;
  mode: 'survival' | 'quest';
  modeState: ModeState;
  phase: 'Playing' | 'GameOver' | 'Paused' | 'PerkSelect' | 'QuestResults' | 'QuestFailed';
  perkChoices: PerkId[] | null;
  nextEntityId: number;
  projectilePool: ObjectPool<ProjectileState>;
  lastStepTimeMs: number;
  profile: SimProfile;
  selectedQuestId: QuestId;
}

export interface SimProfile {
  inputMs: number;
  playerMs: number;
  weaponsMs: number;
  projectilesMs: number;
  modeMs: number;
  creaturesMs: number;
  collisionMs: number;
  bonusesMs: number;
  progressionMs: number;
  totalMs: number;
}

export interface SurvivalModeState {
  kind: 'survival';
  elapsedTicks: number;
  spawnBudget: number;
  difficultyLevel: number;
  maxCreaturesSoftCap: number;
  spawnMinDistance: number;
  spawnMaxDistance: number;
  killsTotal: number;
  nextWaveIndex: number;
  spawnQueue: {
    kind: string;
    remaining: number;
    pattern: 'edge' | 'near' | 'ring';
    intervalTicks: number;
    nextTick: number;
  }[];
}

export interface QuestModeState {
  kind: 'quest';
  questId: QuestId;
  elapsedTicks: number;
  killsByKind: Record<string, number>;
  killsTotal: number;
  bonusesCollected: number;
  bonusesCollectedByType: Record<string, number>;
  status: QuestStatus;
  nextTimelineIndex: number;
  messages: { text: string; tick: number }[];
  spawnStreams: {
    creatureKind: string;
    count: number;
    pattern: QuestSpawnPattern;
    radius?: number;
    center?: Vec2;
    positions?: Vec2[];
    intervalTicks: number;
    nextTick: number;
    endTick: number;
  }[];
}

export type ModeState = SurvivalModeState | QuestModeState;

export function createSurvivalModeState(): SurvivalModeState {
  return {
    kind: 'survival',
    elapsedTicks: 0,
    spawnBudget: 0,
    difficultyLevel: 0,
    maxCreaturesSoftCap: 6,
    spawnMinDistance: 10,
    spawnMaxDistance: 24,
    killsTotal: 0,
    nextWaveIndex: 0,
    spawnQueue: [],
  };
}

export function createQuestModeState(questId: QuestId = DEFAULT_QUEST_ID): QuestModeState {
  return {
    kind: 'quest',
    questId,
    elapsedTicks: 0,
    killsByKind: {},
    killsTotal: 0,
    bonusesCollected: 0,
    bonusesCollectedByType: {},
    status: 'Playing',
    nextTimelineIndex: 0,
    messages: [],
    spawnStreams: [],
  };
}

export function createSimState(
  seed = 1,
  options: { mode?: SimState['mode']; questId?: QuestId } = {},
): SimState {
  const rng = new Rng(seed);
  const mode = options.mode ?? 'survival';
  const selectedQuestId = options.questId ?? DEFAULT_QUEST_ID;
  const projectilePool = new ObjectPool<ProjectileState>(
    () => ({
      id: 0,
      pos: vec2(0, 0),
      vel: vec2(0, 0),
      alive: false,
      radius: 0.4,
      damage: 0,
      lifeTicksRemaining: 0,
      owner: 'player',
      kind: '',
      pierceRemaining: 0,
      explosionRadius: 0,
      explosionDamage: 0,
    }),
    50,
    1000,
  );

  const startingWeapon = WEAPONS[0]?.id ?? 'pistol';
  const player: PlayerState = {
    id: 1,
    pos: vec2(0, 0),
    vel: vec2(0, 0),
    radius: 1.2,
    hp: 100,
    hpMax: 100,
    baseHpMax: 100,
    aimDir: vec2(1, 0),
    aimAngle: 0,
    fireCooldownTicks: 0,
    weaponId: startingWeapon,
    ammo: WEAPONS[0]?.ammoMax ?? 0,
    reloadTicksRemaining: 0,
    input: { ...EMPTY_INPUT },
    baseSpeed: 6,
    activeEffects: {},
    level: 1,
    xp: 0,
    xpToNext: xpToNextForLevel(1),
    perks: {},
    perkStats: createPerkStats(),
    unlockedWeapons: new Set<WeaponId>([startingWeapon]),
    availableWeapons: [],
  };

  const state: SimState = {
    tick: 0,
    rng,
    player,
    creatures: [],
    projectiles: [],
    bonuses: [],
    score: 0,
    timeAlive: 0,
    mode,
    modeState: mode === 'quest' ? createQuestModeState(selectedQuestId) : createSurvivalModeState(),
    phase: 'Playing',
    perkChoices: null,
    nextEntityId: 2,
    projectilePool,
    lastStepTimeMs: 0,
    profile: {
      inputMs: 0,
      playerMs: 0,
      weaponsMs: 0,
      projectilesMs: 0,
      modeMs: 0,
      creaturesMs: 0,
      collisionMs: 0,
      bonusesMs: 0,
      progressionMs: 0,
      totalMs: 0,
    },
    selectedQuestId,
  };

  refreshAvailableWeapons(player);
  return state;
}
