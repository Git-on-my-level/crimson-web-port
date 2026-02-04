import type { QuestModeState, SimState } from '../state';
import type { SimEvent } from '../types';

export function updateQuestMode(state: SimState, events: SimEvent[]): void {
  void events;
  if (state.mode !== 'quest') {
    return;
  }
  const modeState = ensureQuestState(state);
  modeState.elapsedTicks += 1;
}

function ensureQuestState(state: SimState): QuestModeState {
  if (state.modeState.kind === 'quest') {
    return state.modeState;
  }
  const next: QuestModeState = { kind: 'quest', elapsedTicks: 0 };
  state.modeState = next;
  return next;
}
