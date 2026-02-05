import { describe, expect, it } from 'vitest';
import { Sim } from '../src/sim/sim';
import type { InputFrame } from '../src/sim/types';
import { getTerrainCellCoords, getTerrainIndex, isTerrainBlocked } from '../src/sim/terrain';
import { WORLD_BOUNDS } from '../src/sim/world';

const moveRightInput: InputFrame = {
  moveX: 1,
  moveY: 0,
  aimX: 100,
  aimY: 0,
  fire: false,
  reload: false,
  weaponSwitch: null,
  pause: false,
  perkChoice: null,
};

describe('Terrain collision', () => {
  it('movement is not blocked by terrain blocked cells (background-only terrain)', () => {
    const sim = new Sim({ seed: 101 });
    const terrain = sim.state.terrain;
    const originalX = sim.state.player.pos.x;

    const targetPos = {
      x: sim.state.player.pos.x + terrain.cellSize,
      y: sim.state.player.pos.y,
    };
    const cell = getTerrainCellCoords(terrain, targetPos.x, targetPos.y);
    terrain.blocked[getTerrainIndex(terrain, cell.cellX, cell.cellY)] = 1;

    sim.step(moveRightInput);
    expect(sim.state.player.pos.x).toBeGreaterThan(originalX);
    expect(isTerrainBlocked(terrain, sim.state.player.pos.x, sim.state.player.pos.y, sim.state.player.radius)).toBe(false);
  });

  it('player movement is clamped at world bounds', () => {
    const sim = new Sim({ seed: 102 });
    const player = sim.state.player;
    const radius = player.radius;

    player.pos.x = WORLD_BOUNDS.maxX - radius - 0.1;
    for (let i = 0; i < 120; i += 1) {
      sim.step(moveRightInput);
    }
    expect(player.pos.x).toBeLessThanOrEqual(WORLD_BOUNDS.maxX - radius);
    expect(isTerrainBlocked(sim.state.terrain, player.pos.x, player.pos.y, radius)).toBe(false);
  });
});
