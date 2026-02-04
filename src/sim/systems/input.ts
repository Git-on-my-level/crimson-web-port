import type { InputFrame } from '../types';
import type { SimState } from '../state';

export function applyInput(state: SimState, input: InputFrame): void {
  state.player.input = { ...input };
}
