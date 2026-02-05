import type { InputFrame } from '../../sim/types';
import type { Sim } from '../../sim/sim';
import type { ParityFinding } from '../report';

export type ProbeRunOverride = {
  seed?: number;
  ticks?: number;
  setup?: (sim: Sim) => void;
  input?: (tick: number, sim: Sim) => InputFrame;
};

export type ProbeDefinition = {
  id: string;
  description: string;
  tags: string[];
  defaultSeed: number;
  defaultTicks: number;
  inputPatterns?: Array<'idle' | 'constant-fire'>;
  run: (override?: ProbeRunOverride) => ParityFinding[];
};
