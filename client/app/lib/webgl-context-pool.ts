function getDefaultMaxContexts(): number {
  if (typeof window !== "undefined" && window.innerWidth >= 1024) {
    return 3;
  }
  return 2;
}

/**
 * Virtual WebGL Context Pool
 * Prevents mobile browsers (iOS Safari, mobile Chrome) from exhausting
 * the hard limit of 8-16 simultaneous WebGL contexts and throwing webglcontextlost.
 */
export class WebGLContextPool {
  private maxActiveContexts: number;
  private activeSlots: Set<string> = new Set();
  private waitingQueue: string[] = [];
  private subscribers: Map<string, (canRender: boolean) => void> = new Map();

  constructor(maxActiveContexts: number = getDefaultMaxContexts()) {
    this.maxActiveContexts = maxActiveContexts;
  }

  public setMaxActiveContexts(max: number): void {
    this.maxActiveContexts = max;
    this.processQueue();
  }

  public getMaxActiveContexts(): number {
    return this.maxActiveContexts;
  }

  public getActiveSlots(): string[] {
    return Array.from(this.activeSlots);
  }

  public getWaitingQueue(): string[] {
    return [...this.waitingQueue];
  }

  public isSlotActive(id: string): boolean {
    return this.activeSlots.has(id);
  }

  private processQueue(): void {
    while (this.activeSlots.size < this.maxActiveContexts && this.waitingQueue.length > 0) {
      const nextId = this.waitingQueue.shift();
      if (nextId && this.subscribers.has(nextId)) {
        this.activeSlots.add(nextId);
        this.subscribers.get(nextId)?.(true);
      }
    }
  }

  /**
   * Attempts to claim a rendering slot for the element.
   * If capacity is available, claims slot and returns true.
   * If full and evictLru is true, evicts oldest active slot.
   * Otherwise queues the element and returns false.
   */
  public claimSlot(id: string, evictLru = false): boolean {
    if (this.activeSlots.has(id)) {
      // Move to most recently used position in Set
      this.activeSlots.delete(id);
      this.activeSlots.add(id);
      return true;
    }

    if (this.activeSlots.size < this.maxActiveContexts) {
      this.activeSlots.add(id);
      const queueIndex = this.waitingQueue.indexOf(id);
      if (queueIndex !== -1) {
        this.waitingQueue.splice(queueIndex, 1);
      }
      this.subscribers.get(id)?.(true);
      return true;
    }

    if (evictLru && this.activeSlots.size > 0) {
      const oldestId = this.activeSlots.values().next().value;
      if (oldestId) {
        this.activeSlots.delete(oldestId);
        this.subscribers.get(oldestId)?.(false);
      }

      this.activeSlots.add(id);
      const queueIndex = this.waitingQueue.indexOf(id);
      if (queueIndex !== -1) {
        this.waitingQueue.splice(queueIndex, 1);
      }
      this.subscribers.get(id)?.(true);
      return true;
    }

    if (!this.waitingQueue.includes(id)) {
      this.waitingQueue.push(id);
    }
    this.subscribers.get(id)?.(false);
    return false;
  }

  /**
   * Releases an active slot and promotes next queued element if available.
   */
  public releaseSlot(id: string): void {
    if (this.activeSlots.has(id)) {
      this.activeSlots.delete(id);
      this.subscribers.get(id)?.(false);
    }

    const queueIndex = this.waitingQueue.indexOf(id);
    if (queueIndex !== -1) {
      this.waitingQueue.splice(queueIndex, 1);
    }

    this.processQueue();
  }

  /**
   * Subscribes a listener to slot activation/revocation events.
   */
  public subscribe(id: string, onChange: (canRender: boolean) => void): () => void {
    this.subscribers.set(id, onChange);
    onChange(this.activeSlots.has(id));

    return () => {
      this.subscribers.delete(id);
      const queueIndex = this.waitingQueue.indexOf(id);
      if (queueIndex !== -1) {
        this.waitingQueue.splice(queueIndex, 1);
      }
      this.releaseSlot(id);
    };
  }

  /**
   * Resets all internal pool state.
   */
  public reset(): void {
    this.activeSlots.clear();
    this.waitingQueue = [];
    this.subscribers.clear();
  }
}

export const webGLContextPool = new WebGLContextPool();
