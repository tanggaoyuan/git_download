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
const Download_1 = __importDefault(require("./lib/Download"));
const Merge_1 = __importDefault(require("./lib/Merge"));
const Tool_1 = require("./lib/Tool");
const fs_1 = __importDefault(require("fs"));
const Upload_1 = __importDefault(require("./lib/Upload"));
const node_1 = require("request_chain/node");
const log = {};
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    const config = JSON.parse(fs_1.default.readFileSync(Tool_1.DOWNLOAD_LIST_PATH, 'utf-8'));
    const time = setInterval(() => {
        console.log(log);
    }, 2000);
    const tasks = config.urls.map((element) => __awaiter(void 0, void 0, void 0, function* () {
        const task_key = element.name || (yield node_1.MD5.getMd5((element === null || element === void 0 ? void 0 : element.url) || element));
        if (typeof element === 'string') {
            //   const downloader = new GitDownload(element);
            // TODO
        }
        else {
            const mode = element.mode;
            const handleTask = (downloads) => __awaiter(void 0, void 0, void 0, function* () {
                const [audio, video] = yield Promise.all(downloads.map((item) => item.wait()));
                const merge = new Merge_1.default({
                    fragments: video
                        ? [audio.save_file_path, video.save_file_path]
                        : [audio.save_file_path],
                    save_dir_path: audio.save_dir_path,
                    file_name: audio.file_name,
                }, video ? 'MergeVideo' : 'MergeAudio');
                log[task_key + '_' + (video ? 'video' : 'audio')] = merge;
                const merg_info = yield merge.wait();
                const dirname = audio.save_dir_path
                    .replace(Tool_1.DOWNLOAD_ASSET_PATH, '')
                    .replace(/\/|\\/g, '');
                const parent_file_id = yield (0, Tool_1.getAliCloudId)(dirname ? `${config.cloud_path}/${dirname}` : config.cloud_path);
                const upload = new Upload_1.default(merg_info, parent_file_id);
                log[task_key + '_' + (video ? 'video' : 'audio')] = upload;
                return upload.wait();
            });
            const downloads = [new Download_1.default(element.url, 'audio')];
            const tasks = [];
            if (mode === 'audio' || mode === 'all') {
                log[`${task_key}_audio`] = downloads[0];
                const promise = handleTask([...downloads]);
                tasks.push(promise);
            }
            if (mode === 'video' || mode === 'all') {
                downloads.push(new Download_1.default(element.url, 'video'));
                log[`${task_key}_video`] = downloads[1];
                const promise = handleTask(downloads);
                tasks.push(promise);
            }
            yield Promise.all(tasks);
        }
    }));
    yield Promise.all(tasks).finally(() => {
        clearInterval(time);
    });
});
main();
// const test = async () => {
//   const audio = {
//     file_name: '【MMD Genshin Impact】Hu Tao  胡桃 (フータオ) -『Doodle』',
//     save_dir_path: 'download\\assets\\wqizrWtPBP4',
//     save_file_path:
//       'G:\\前端项目\\个人项目\\git_download\\download\\assets\\wqizrWtPBP4\\【MMD Genshin Impact】Hu Tao  胡桃 (フータオ) -『Doodle』_audio.m4a',
//   };
//   const video = {
//     file_name: '【MMD Genshin Impact】Hu Tao  胡桃 (フータオ) -『Doodle』',
//     save_dir_path: 'download\\assets\\wqizrWtPBP4',
//     save_file_path:
//       'G:\\前端项目\\个人项目\\git_download\\download\\assets\\wqizrWtPBP4\\【MMD Genshin Impact】Hu Tao  胡桃 (フータオ) -『Doodle』_video.mp4',
//   };
//   const audioMerge = new GitMerge(
//     {
//       fragments: [audio.save_file_path],
//       save_dir_path: audio.save_dir_path,
//       file_name: audio.file_name,
//     },
//     'MergeAudio',
//   );
//   const videoMerge = new GitMerge(
//     {
//       fragments: [audio.save_file_path, video.save_file_path],
//       save_dir_path: audio.save_dir_path,
//       file_name: audio.file_name,
//     },
//     'MergeVideo',
//   );
//   await Promise.all([audioMerge.wait(), videoMerge.wait()]);
//   console.log('任务完成');
// };
// test();
