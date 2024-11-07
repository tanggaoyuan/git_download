"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Listener {
    constructor(action) {
        this.status = 'wait';
        this.progress = 0;
        this.events = new Map();
        this.action = action;
    }
    notifyStatus(value) {
        if (this.status === value) {
            return;
        }
        this.status = value;
        const fns = this.events.get('status') || [];
        fns.forEach((fn) => {
            fn(value);
        });
    }
    notifyProgress(value) {
        if (this.progress === value) {
            return;
        }
        this.progress = value;
        const fns = this.events.get('progress') || [];
        fns.forEach((fn) => {
            fn(value);
        });
    }
    on(type, fn) {
        const fns = this.events.get(type) || [];
        fns.push(fn);
        this.events.set(type, fns);
    }
    off(type, fn) {
        if (!this.events.has(type)) {
            return;
        }
        if (!fn) {
            this.events.set(type, []);
            return;
        }
        const fns = this.events.get(type);
        this.events.set(type, fns.filter((item) => item !== fn));
    }
    toJSON() {
        return {
            action: this.action,
            progress: this.progress,
            status: this.status,
        };
    }
}
exports.default = Listener;
