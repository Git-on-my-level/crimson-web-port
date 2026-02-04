import Phaser from 'phaser';
import type { SimState } from '../../sim/state';
import type { EntityId } from '../../sim/types';

export type RenderTransform = {
  originX: number;
  originY: number;
  pixelsPerUnit: number;
};

const COLORS = {
  player: 0xf97316,
  creature: 0x22c55e,
  projectile: 0x60a5fa,
  bonus: 0xfacc15,
};

export class PhaserRenderAdapter {
  private readonly scene: Phaser.Scene;
  private player?: Phaser.GameObjects.Arc;
  private readonly creatures = new Map<EntityId, Phaser.GameObjects.Arc>();
  private readonly projectiles = new Map<EntityId, Phaser.GameObjects.Arc>();
  private readonly bonuses = new Map<EntityId, Phaser.GameObjects.Arc>();
  private transform: RenderTransform;

  constructor(scene: Phaser.Scene, transform: RenderTransform) {
    this.scene = scene;
    this.transform = transform;
  }

  setTransform(transform: RenderTransform): void {
    this.transform = transform;
  }

  render(state: SimState): void {
    this.ensurePlayer(state);
    this.syncEntities(state.creatures, this.creatures, COLORS.creature, 10, (entry) => entry.alive);
    this.syncEntities(state.projectiles, this.projectiles, COLORS.projectile, 4, (entry) => entry.alive);
    this.syncEntities(state.bonuses, this.bonuses, COLORS.bonus, 6, (entry) => entry.active);
  }

  private ensurePlayer(state: SimState): void {
    if (!this.player) {
      this.player = this.scene.add.circle(0, 0, 14, COLORS.player);
      this.scene.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    }
    const { x, y } = this.toScreen(state.player.pos.x, state.player.pos.y);
    this.player.setPosition(x, y);
  }

  private syncEntities<T extends { id: EntityId; pos: { x: number; y: number } }>(
    entries: T[],
    map: Map<EntityId, Phaser.GameObjects.Arc>,
    color: number,
    radius: number,
    isActive: (entry: T) => boolean,
  ): void {
    const seen = new Set<EntityId>();

    for (const entry of entries) {
      if (!isActive(entry)) {
        continue;
      }
      seen.add(entry.id);
      const obj = map.get(entry.id) ?? this.createCircle(map, entry.id, radius, color);
      const { x, y } = this.toScreen(entry.pos.x, entry.pos.y);
      obj.setPosition(x, y);
    }

    for (const [id, obj] of map) {
      if (!seen.has(id)) {
        obj.destroy();
        map.delete(id);
      }
    }
  }

  private createCircle(
    map: Map<EntityId, Phaser.GameObjects.Arc>,
    id: EntityId,
    radius: number,
    color: number,
  ): Phaser.GameObjects.Arc {
    const circle = this.scene.add.circle(0, 0, radius, color);
    map.set(id, circle);
    return circle;
  }

  private toScreen(simX: number, simY: number): { x: number; y: number } {
    return {
      x: this.transform.originX + simX * this.transform.pixelsPerUnit,
      y: this.transform.originY + simY * this.transform.pixelsPerUnit,
    };
  }
}
