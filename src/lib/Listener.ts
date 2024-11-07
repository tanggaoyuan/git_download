class Listener {
  public status: 'wait' | 'pending' | 'done' = 'wait';
  public progress: number = 0;
  public action: string;
  private readonly events;

  constructor(action: 'download' | 'merge' | 'upload') {
    this.events = new Map<string, any[]>();
    this.action = action;
  }

  public notifyStatus(value: 'wait' | 'pending' | 'done') {
    if (this.status === value) {
      return;
    }
    this.status = value;
    const fns = this.events.get('status') || [];
    fns.forEach((fn) => {
      fn(value);
    });
  }

  public notifyProgress(value: number) {
    if (this.progress === value) {
      return;
    }
    this.progress = value;
    const fns = this.events.get('progress') || [];
    fns.forEach((fn) => {
      fn(value);
    });
  }

  on(type: 'status', fn: (data: string) => void): void;
  on(type: 'progress', fn: (data: number) => void): void;
  on(type: 'status' | 'progress', fn: (data: any) => void): void {
    const fns = this.events.get(type) || [];
    fns.push(fn);
    this.events.set(type, fns);
  }

  off(type: 'status' | 'progress', fn?: (data: any) => void) {
    if (!this.events.has(type)) {
      return;
    }
    if (!fn) {
      this.events.set(type, []);
      return;
    }
    const fns = this.events.get(type);
    this.events.set(
      type,
      fns.filter((item) => item !== fn),
    );
  }

  toJSON() {
    return {
      action: this.action,
      progress: this.progress,
      status: this.status,
    };
  }
}

export default Listener;
