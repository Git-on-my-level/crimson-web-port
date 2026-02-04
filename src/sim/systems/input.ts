import type { InputFrame } from '../types';
import type { SimState } from '../state';

let pauseWasDown = false;

export function applyInput(state: SimState, input: InputFrame): void {
  state.player.input = { ...input };

  if (input.pause && !pauseWasDown) {
    if (state.phase === 'Playing') {
      state.phase = 'Paused';
    } else if (state.phase === 'Paused') {
      state.phase = 'Playing';
    }
  }
  pauseWasDown = input.pause;
}
