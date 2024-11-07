"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const Pool_1 = __importDefault(require("./Pool"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const Listener_1 = __importDefault(require("./Listener"));
const pool = new Pool_1.default(2);
class GitMerge extends Listener_1.default {
    constructor(parmas, mode) {
        super('merge');
        this.promise = pool.enqueue(() => {
            this.notifyStatus('pending');
            if (mode === 'MergeVideo') {
                const [audioPath, videoPath] = parmas.fragments;
                return new Promise((resolve, reject) => {
                    const save_path = path_1.default.join(parmas.save_dir_path, `${parmas.file_name}.mp4`);
                    (0, fluent_ffmpeg_1.default)()
                        .input(videoPath)
                        .input(audioPath)
                        .audioCodec('aac') // 使用 AAC 编码
                        .audioBitrate('320k') // 设置音频比特率为 320kbps
                        .videoCodec('copy') // 保持原画质
                        .on('progress', (progress) => {
                        this.notifyProgress(Math.round(progress.percent));
                    })
                        .on('end', () => {
                        this.notifyStatus('done');
                        resolve(save_path);
                    })
                        .on('error', (error) => {
                        this.notifyStatus('done');
                        reject(error);
                    })
                        .save(save_path);
                });
            }
            else if (mode === 'MergeAudio') {
                const [audioPath] = parmas.fragments;
                return new Promise((resolve, reject) => {
                    const save_path = path_1.default.join(parmas.save_dir_path, `${parmas.file_name}.mp3`);
                    (0, fluent_ffmpeg_1.default)()
                        .input(audioPath)
                        .audioCodec('libmp3lame') // 使用 AAC 编码
                        .audioBitrate('320k') // 设置音频比特率为 320kbps
                        .on('progress', (progress) => {
                        this.notifyProgress(Math.round(progress.percent));
                    })
                        .on('end', () => {
                        this.notifyStatus('done');
                        resolve(save_path);
                    })
                        .on('error', (error) => {
                        this.notifyStatus('done');
                        reject(error);
                    })
                        .save(save_path);
                });
            }
            else {
                return Promise.resolve({});
            }
        });
    }
    wait() {
        return this.promise;
    }
}
exports.default = GitMerge;
