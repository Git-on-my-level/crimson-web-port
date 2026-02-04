import type { BonusId } from '../content/bonuses';
import type { PerkId } from '../content/perks';

export type EntityId = number;

export interface Vec2 {
  x: number;
  y: number;
}

export interface InputFrame {
  moveX: number;
  moveY: number;
  aimX: number;
  aimY: number;
  fire: boolean;
  reload: boolean;
  weaponSwitch: number | null;
  pause: boolean;
  perkChoice: number | null;
}

export const EMPTY_INPUT: InputFrame = {
  moveX: 0,
  moveY: 0,
  aimX: 0,
  aimY: 0,
  fire: false,
  reload: false,
  weaponSwitch: null,
  pause: false,
  perkChoice: null,
};

export type SimEvent =
  | { type: 'spawnProjectile'; id: EntityId; pos: Vec2; vel: Vec2; kind: string }
  | { type: 'spawnCreature'; id: EntityId; pos: Vec2; kind: string }
  | { type: 'spawnBonus'; id: EntityId; pos: Vec2; kind: BonusId }
  | { type: 'damage'; target: 'player' | 'creature'; id: EntityId; amount: number }
  | { type: 'death'; target: 'player' | 'creature'; id: EntityId }
  | { type: 'gameOver'; id: EntityId }
  | { type: 'score'; amount: number; total: number }
  | { type: 'xp'; amount: number; total: number; level: number }
  | { type: 'levelUp'; level: number; xpToNext: number }
  | { type: 'perkOffered'; level: number; choices: PerkId[] }
  | { type: 'perkChosen'; perkId: PerkId; level: number }
  | { type: 'playSfx'; name: string }
  | { type: 'pickup'; id: EntityId; bonusType: string }
  | { type: 'questStatusChanged'; status: 'Playing' | 'Success' | 'Failed' }
  | { type: 'questMessage'; text: string };

export function vec2(x = 0, y = 0): Vec2 {
  return { x, y };
}

export function vec2AddInplace(target: Vec2, delta: Vec2): void {
  target.x += delta.x;
  target.y += delta.y;
}

export function vec2Sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function vec2Scale(a: Vec2, scalar: number): Vec2 {
  return { x: a.x * scalar, y: a.y * scalar };
}

export function vec2Length(a: Vec2): number {
  return Math.hypot(a.x, a.y);
}
