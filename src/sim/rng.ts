export class Rng {
  private state = 1 >>> 0;

  constructor(seed = 1) {
    this.seed(seed);
  }

  seed(seed: number): void {
    const normalized = seed >>> 0;
    this.state = normalized === 0 ? 1 : normalized;
  }

  nextUint32(): number {
    let t = (this.state + 0x6d2b79f5) >>> 0;
    this.state = t;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  }

  nextFloat01(): number {
    return this.nextUint32() / 4294967296;
  }

  nextInt(maxExclusive: number): number {
    if (maxExclusive <= 0) {
      return 0;
    }
    return this.nextUint32() % maxExclusive;
  }
}
