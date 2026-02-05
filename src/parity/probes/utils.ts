import type { ParityFinding } from '../report';
import type { InputFrame, SimEvent } from '../../sim/types';
import { EMPTY_INPUT } from '../../sim/types';
import type { Sim } from '../../sim/sim';
import type { SimState } from '../../sim/state';

export type ProbeTickObserver = (tick: number, sim: Sim, events: SimEvent[]) => void;

export function constantFireInput(): InputFrame {
  return {
    ...EMPTY_INPUT,
    aimX: 1,
    aimY: 0,
    fire: true,
  };
}

export function idleInput(): InputFrame {
  return { ...EMPTY_INPUT };
}

export function clearTerrain(state: SimState): void {
  state.terrain.blocked.fill(0);
}

export function runSimTicks(
  sim: Sim,
  ticks: number,
  inputForTick: (tick: number, sim: Sim) => InputFrame,
  onTick?: ProbeTickObserver,
): void {
  for (let tick = 0; tick < ticks; tick += 1) {
    const input = inputForTick(tick, sim);
    const result = sim.step(input);
    if (onTick) {
      onTick(sim.state.tick, sim, result.events);
    }
  }
}

export function buildProbeFinding(params: {
  id: string;
  ok: boolean;
  message: string;
  details?: string;
  expected?: unknown;
  actual?: unknown;
  tags: string[];
}): ParityFinding {
  const { id, ok, message, details, expected, actual, tags } = params;
  return {
    id,
    status: ok ? 'pass' : 'fail',
    message,
    details,
    expected,
    actual,
    tags,
  };
}
