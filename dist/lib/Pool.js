"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
class Pool {
    constructor(limit) {
        this.maxLimit = limit;
        this.taskStore = new Set();
        this.taskQueue = [];
    }
    enqueue(task) {
        return new Promise((resolve, reject) => {
            // 将任务包装为能够解析的函数
            const wrappedTask = () => task().then(resolve).catch(reject);
            // 将包装后的任务加入队列
            this.taskQueue.push(wrappedTask);
            // 尝试处理下一个任务
            this.runNext();
        });
    }
    runNext() {
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
    size() {
        return this.taskStore.size;
    }
    isIdle() {
        return this.taskStore.size === 0 && this.taskQueue.length === 0;
    }
    clear() {
        this.taskQueue.length = 0;
    }
    waitForAll() {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.allSettled(Array.from(this.taskStore));
            if (this.taskStore.size > 0) {
                yield this.waitForAll();
            }
        });
    }
    setMaxLimit(limit) {
        this.maxLimit = limit;
        this.runNext();
    }
}
exports.default = Pool;
