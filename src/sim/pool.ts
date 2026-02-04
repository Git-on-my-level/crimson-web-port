export interface PoolSlot<T> {
  id: number;
  active: boolean;
  data: T;
}

export class ObjectPool<T> {
  slots: PoolSlot<T>[];
  freeList: number[];
  nextId: number;
  maxCapacity: number;
  factory: () => T;

  constructor(
    factory: () => T,
    initialCapacity: number,
    maxCapacity: number,
  ) {
    this.factory = factory;
    this.slots = new Array(initialCapacity);
    this.freeList = [];
    this.nextId = 1;
    this.maxCapacity = maxCapacity;

    for (let i = 0; i < initialCapacity; i++) {
      this.slots[i] = {
        id: 0,
        active: false,
        data: factory(),
      };
      this.freeList.push(i);
    }
  }

  alloc(initializer: (data: T) => void, idOverride?: number): number | null {
    let slotIndex: number;

    if (this.freeList.length > 0) {
      slotIndex = this.freeList.pop()!;
    } else if (this.slots.length < this.maxCapacity) {
      slotIndex = this.slots.length;
      this.slots.push({
        id: 0,
        active: false,
        data: this.factory(),
      });
    } else {
      return null;
    }

    const slot = this.slots[slotIndex];
    slot.active = true;
    if (idOverride !== undefined) {
      slot.id = idOverride;
      if (idOverride >= this.nextId) {
        this.nextId = idOverride + 1;
      }
    } else {
      slot.id = this.nextId++;
    }
    initializer(slot.data);

    return slot.id;
  }

  get(id: number): { index: number; data: T } | null {
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      if (slot.active && slot.id === id) {
        return { index: i, data: slot.data };
      }
    }
    return null;
  }

  release(id: number): boolean {
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      if (slot.active && slot.id === id) {
        slot.active = false;
        slot.id = 0;
        this.freeList.push(i);
        return true;
      }
    }
    return false;
  }

  forEachActive(callback: (id: number, data: T) => void): void {
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      if (slot.active) {
        callback(slot.id, slot.data);
      }
    }
  }

  getActiveCount(): number {
    return this.slots.length - this.freeList.length;
  }

  getCapacity(): number {
    return this.slots.length;
  }
}
