class Pool {
  private maxLimit: number;
  private readonly taskStore: Set<Promise<any>>;
  private readonly taskQueue: Array<() => Promise<any>>;

  constructor(limit: number) {
    this.maxLimit = limit;
    this.taskStore = new Set();
    this.taskQueue = [];
  }

  public enqueue(task: () => Promise<any>): Promise<any> {
    return new Promise((resolve, reject) => {
      // 将任务包装为能够解析的函数
      const wrappedTask = () => task().then(resolve).catch(reject);
      // 将包装后的任务加入队列
      this.taskQueue.push(wrappedTask);
      // 尝试处理下一个任务
      this.runNext();
    });
  }

  private runNext(): void {
    // 如果当前任务数量达到最大限制，直接返回
    if (this.taskStore.size >= this.maxLimit || this.taskQueue.length === 0) {
      return;
    }
    // 从队列中获取下一个任务
    const nextTask = this.taskQueue.shift();
    const taskPromise = nextTask().finally(() => {
      this.taskStore.delete(taskPromise); // 任务完成后从当前任务集合中移除
      this.runNext(); // 尝试处理下一个任务
    });
    this.taskStore.add(taskPromise);
  }

  public size(): number {
    return this.taskStore.size;
  }

  public isIdle(): boolean {
    return this.taskStore.size === 0 && this.taskQueue.length === 0;
  }

  public clear(): void {
    this.taskQueue.length = 0;
  }

  public async waitForAll(): Promise<void> {
    await Promise.allSettled(Array.from(this.taskStore));
    if (this.taskStore.size > 0) {
      await this.waitForAll();
    }
  }

  public setMaxLimit(limit: number): void {
    this.maxLimit = limit;
    this.runNext();
  }
}

export default Pool;
