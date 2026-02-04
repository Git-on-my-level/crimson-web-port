import { describe, expect, it } from 'vitest';
import { Sim } from '../src/sim/sim';
import type { InputFrame } from '../src/sim/types';
import { getTerrainCellCoords, getTerrainIndex, isTerrainBlocked } from '../src/sim/terrain';

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
  it('prevents player from entering blocked cells', () => {
    const sim = new Sim({ seed: 101 });
    const terrain = sim.state.terrain;

    const targetPos = {
      x: sim.state.player.pos.x + terrain.cellSize,
      y: sim.state.player.pos.y,
    };
    const cell = getTerrainCellCoords(terrain, targetPos.x, targetPos.y);
    terrain.blocked[getTerrainIndex(terrain, cell.cellX, cell.cellY)] = 1;

    for (let i = 0; i < 120; i += 1) {
      sim.step(moveRightInput);
      expect(isTerrainBlocked(terrain, sim.state.player.pos.x, sim.state.player.pos.y, sim.state.player.radius)).toBe(false);
    }
  });
});
