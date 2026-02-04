export class FixedStepClock {
  public readonly stepSeconds: number;
  private accumulator = 0;

  constructor(stepSeconds = 1 / 60) {
    this.stepSeconds = stepSeconds;
  }

  accumulate(deltaSeconds: number): number {
    this.accumulator += deltaSeconds;
    let steps = 0;
    while (this.accumulator >= this.stepSeconds) {
      this.accumulator -= this.stepSeconds;
      steps += 1;
    }
    return steps;
  }
}
