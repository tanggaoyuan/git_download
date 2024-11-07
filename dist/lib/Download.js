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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Listener_1 = __importDefault(require("./Listener"));
const Pool_1 = __importDefault(require("./Pool"));
const Tool_1 = require("./Tool");
const pool = new Pool_1.default(3);
class GitDownload extends Listener_1.default {
    constructor(url, mode) {
        super('download');
        this.promise = pool.enqueue(() => __awaiter(this, void 0, void 0, function* () {
            this.notifyStatus('pending');
            try {
                if (url.includes('youtu')) {
                    const info = yield (0, Tool_1.getYoutubeVidoInfo)(url);
                    const resonse = yield (0, Tool_1.youtubeDownload)(info, mode, (progress) => {
                        this.notifyProgress(progress);
                    });
                    this.notifyStatus('done');
                    return resonse;
                }
                else {
                    this.notifyStatus('done');
                    return Promise.resolve({});
                }
            }
            catch (error) {
                this.notifyStatus('done');
            }
        }));
    }
    wait() {
        return this.promise;
    }
}
exports.default = GitDownload;
