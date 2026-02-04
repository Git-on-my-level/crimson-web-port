import { EMPTY_INPUT, type InputFrame, type Vec2, vec2 } from './types';
import { Rng } from './rng';

export interface PlayerState {
  id: number;
  pos: Vec2;
  vel: Vec2;
  radius: number;
  hp: number;
  hpMax: number;
  aimDir: Vec2;
  aimAngle: number;
  fireCooldown: number;
  weaponId: number;
  input: InputFrame;
}

export interface CreatureState {
  id: number;
  pos: Vec2;
  hp: number;
  alive: boolean;
  kind: string;
}

export interface ProjectileState {
  id: number;
  pos: Vec2;
  vel: Vec2;
  alive: boolean;
  kind: string;
}

export interface BonusState {
  id: number;
  pos: Vec2;
  active: boolean;
  kind: string;
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
  nextEntityId: number;
}

export function createSimState(seed = 1): SimState {
  const rng = new Rng(seed);
  return {
    tick: 0,
    rng,
    player: {
      id: 1,
      pos: vec2(0, 0),
      vel: vec2(0, 0),
      radius: 1.2,
      hp: 100,
      hpMax: 100,
      aimDir: vec2(1, 0),
      aimAngle: 0,
      fireCooldown: 0,
      weaponId: 0,
      input: { ...EMPTY_INPUT },
    },
    creatures: [],
    projectiles: [],
    bonuses: [],
    score: 0,
    timeAlive: 0,
    mode: 'survival',
    nextEntityId: 2,
  };
}
