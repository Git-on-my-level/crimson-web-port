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
import { terrain_generate, type TerrainGrid } from './terrain';

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
  shotCooldown: number;
  reloadTimer: number;
  reloadTimerMax: number;
  weaponId: WeaponId;
  ammo: number;
  spreadHeat: number;
  altWeaponId: WeaponId | null;
  altAmmo: number;
  altReloadTimer: number;
  altReloadTimerMax: number;
  altShotCooldown: number;
  altSpreadHeat: number;
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
  prevFirePressed: boolean;
  prevReloadPressed: boolean;
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
  heading: number;
  targetHeading: number;
  moveScale: number;
  aiMode: number;
  flags: number;
  linkIndex: number;
  targetOffsetX: number;
  targetOffsetY: number;
  phaseSeed: number;
  orbitAngle: number;
  orbitRadius: number;
  targetPos: Vec2;
  forceTarget: number;
}

export interface ProjectileState {
  id: number;
  pos: Vec2;
  vel: Vec2;
  alive: boolean;
  radius: number;
  damage: number;
  speedScale: number;
  lifeTicksRemaining: number;
  owner: 'player' | 'creature';
  kind: string;
  pierceRemaining: number;
  explosionRadius: number;
  explosionDamage: number;
}

export interface SecondaryProjectileState {
  id: number;
  pos: Vec2;
  vel: Vec2;
  alive: boolean;
  radius: number;
  damage: number;
  lifeTicksRemaining: number;
  owner: 'player' | 'creature';
  typeId: number;
  explosionRadius: number;
  explosionDamage: number;
}

export interface ParticleState {
  id: number;
  pos: Vec2;
  vel: Vec2;
  alive: boolean;
  radius: number;
  damagePerTick: number;
  lifeTicksRemaining: number;
  styleId: number;
  owner: 'player' | 'creature';
}

export interface BonusState {
  id: number;
  pos: Vec2;
  active: boolean;
  kind: BonusId;
  radius: number;
  lifeTicksRemaining: number;
  lifeTicksMax?: number;
  amount?: number;
  weaponId?: WeaponId;
}

export interface SimState {
  tick: number;
  rng: Rng;
  terrain: TerrainGrid;
  player: PlayerState;
  creatures: CreatureState[];
  projectiles: ProjectileState[];
  secondaryProjectiles: SecondaryProjectileState[];
  particles: ParticleState[];
  bonuses: BonusState[];
  score: number;
  timeAlive: number;
  mode: 'survival' | 'quest';
  modeState: ModeState;
  phase: 'Playing' | 'GameOver' | 'Paused' | 'PerkSelect' | 'QuestResults' | 'QuestFailed';
  perkChoices: PerkId[] | null;
  pendingPerks: number;
  nextEntityId: number;
  projectilePool: ObjectPool<ProjectileState>;
  secondaryProjectilePool: ObjectPool<SecondaryProjectileState>;
  particlePool: ObjectPool<ParticleState>;
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
  elapsedMs: number;
  stage: number;
  spawnCooldownMs: number;
  spawnMinDistance: number;
  spawnMaxDistance: number;
  killsTotal: number;
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
    elapsedMs: 0,
    stage: 0,
    spawnCooldownMs: 0,
    spawnMinDistance: 10,
    spawnMaxDistance: 24,
    killsTotal: 0,
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
      speedScale: 1,
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
  const secondaryProjectilePool = new ObjectPool<SecondaryProjectileState>(
    () => ({
      id: 0,
      pos: vec2(0, 0),
      vel: vec2(0, 0),
      alive: false,
      radius: 0.6,
      damage: 0,
      lifeTicksRemaining: 0,
      owner: 'player',
      typeId: 0,
      explosionRadius: 0,
      explosionDamage: 0,
    }),
    30,
    400,
  );
  const particlePool = new ObjectPool<ParticleState>(
    () => ({
      id: 0,
      pos: vec2(0, 0),
      vel: vec2(0, 0),
      alive: false,
      radius: 1,
      damagePerTick: 0,
      lifeTicksRemaining: 0,
      styleId: 0,
      owner: 'player',
    }),
    60,
    800,
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
    shotCooldown: 0,
    reloadTimer: 0,
    reloadTimerMax: 0,
    weaponId: startingWeapon,
    ammo: WEAPONS[0]?.ammoMax ?? 0,
    spreadHeat: 0.01,
    altWeaponId: null,
    altAmmo: 0,
    altReloadTimer: 0,
    altReloadTimerMax: 0,
    altShotCooldown: 0,
    altSpreadHeat: 0.01,
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
    prevFirePressed: false,
    prevReloadPressed: false,
  };

  const state: SimState = {
    tick: 0,
    rng,
    terrain: terrain_generate(seed),
    player,
    creatures: [],
    projectiles: [],
    secondaryProjectiles: [],
    particles: [],
    bonuses: [],
    score: 0,
    timeAlive: 0,
    mode,
    modeState: mode === 'quest' ? createQuestModeState(selectedQuestId) : createSurvivalModeState(),
    phase: 'Playing',
    perkChoices: null,
    pendingPerks: 0,
    nextEntityId: 2,
    projectilePool,
    secondaryProjectilePool,
    particlePool,
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

  refreshAvailableWeapons(player, { mode });
  return state;
}
