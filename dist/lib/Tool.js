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
exports.getYoutubeVidoInfo = exports.getAliCloudId = exports.aliUpload = exports.youtubeDownload = exports.DOWNLOAD_LIST_PATH = exports.ALI_TOKEN_PATH = exports.DOWNLOAD_ASSET_PATH = exports.DOWNLOAD_STORE_PATH = void 0;
const node_1 = require("base_api/node");
// import { HttpsProxyAgent } from 'https-proxy-agent';
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
exports.DOWNLOAD_STORE_PATH = path_1.default.join(process.cwd(), 'download');
exports.DOWNLOAD_ASSET_PATH = path_1.default.join(exports.DOWNLOAD_STORE_PATH, 'assets');
fs_1.default.mkdirSync(exports.DOWNLOAD_ASSET_PATH, { recursive: true });
exports.ALI_TOKEN_PATH = path_1.default.join(exports.DOWNLOAD_STORE_PATH, 'token.json');
exports.DOWNLOAD_LIST_PATH = path_1.default.join(exports.DOWNLOAD_STORE_PATH, 'download.json');
const local = new node_1.LocalCache(path_1.default.join(exports.DOWNLOAD_STORE_PATH, 'http_cache.json'));
const youapi = new node_1.YoutubeApi({
    localCache: local,
    request: node_1.Wrapper.wrapperAxios(axios_1.default),
    // agent: new HttpsProxyAgent('http://127.0.0.1:7890'),
});
const aliapi = new node_1.AliCloudApi({
    localCache: local,
    request: node_1.Wrapper.wrapperAxios(axios_1.default),
});
const youtubeDownload = (info, mode, onProgress) => __awaiter(void 0, void 0, void 0, function* () {
    const { title } = info;
    const { mp4s, webms, m4as = [] } = mode === 'audio' ? info.audio : info.video;
    let index = 0;
    let stream;
    let err;
    let format;
    const save_dir_path = path_1.default.join(exports.DOWNLOAD_ASSET_PATH, info.videoId);
    fs_1.default.mkdirSync(save_dir_path, { recursive: true });
    while (!stream && index < 10) {
        for (const item of [m4as[index], mp4s[index], webms[index]]) {
            if (!item) {
                continue;
            }
            try {
                index++;
                stream = yield youapi.downloadSource(item, (data) => {
                    onProgress && onProgress(data.progress || 0);
                });
                format = item;
                break;
            }
            catch (error) {
                err = error;
            }
        }
    }
    if (!stream && err) {
        return Promise.reject(err);
    }
    const save_file_path = path_1.default.join(save_dir_path, `${title}_${mode}.${format.ext}`);
    const file = fs_1.default.createWriteStream(save_file_path);
    stream.pipe(file);
    yield new Promise((resolve, reject) => {
        stream.on('error', reject);
        stream.on('close', resolve);
    });
    return {
        file_name: title,
        save_dir_path,
        save_file_path,
    };
});
exports.youtubeDownload = youtubeDownload;
const getAliRequestParams = () => __awaiter(void 0, void 0, void 0, function* () {
    const parmas = JSON.parse(fs_1.default.readFileSync(exports.ALI_TOKEN_PATH, 'utf-8'));
    if (new Date(parmas.token_expire_time).getTime() < Date.now()) {
        const newtoken = yield aliapi
            .refreshToken(parmas.app_id, parmas.refresh_token)
            .getData();
        parmas.refresh_token = newtoken.refresh_token;
        parmas.token = newtoken.access_token;
        parmas.token_expire_time = newtoken.expire_time;
        fs_1.default.writeFileSync(exports.ALI_TOKEN_PATH, JSON.stringify(parmas), 'utf-8');
    }
    return aliapi.generateRequestParams(parmas);
});
const aliUpload = (filepath, cloud_path_id, onprogress) => __awaiter(void 0, void 0, void 0, function* () {
    const params = yield getAliRequestParams();
    return aliapi.uploadFile({
        source_path: filepath,
        parent_file_id: cloud_path_id,
        check_name_mode: 'auto_rename',
    }, params, (data) => {
        onprogress && onprogress(data.progress || 0);
    });
});
exports.aliUpload = aliUpload;
const cloud_map = new Map();
const getAliCloudId = (filepath) => __awaiter(void 0, void 0, void 0, function* () {
    if (!filepath) {
        return 'root';
    }
    const handle = () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const parent_path = filepath.split('/');
        const current_path = parent_path.pop();
        const parent_file_id = yield (0, exports.getAliCloudId)(parent_path.join('/'));
        const parmas = yield getAliRequestParams();
        const { items = [] } = yield aliapi
            .searchFile({
            parent_file_id,
            name: current_path,
        }, parmas)
            .getData();
        let id = (_a = items.find((item) => item.name === current_path)) === null || _a === void 0 ? void 0 : _a.file_id;
        if (!id) {
            const response = yield aliapi
                .createDir({
                parent_file_id,
                name: current_path,
            }, parmas)
                .getData();
            id = response.file_id;
        }
        return id;
    });
    if (!cloud_map.has(filepath)) {
        cloud_map.set(filepath, handle());
    }
    return cloud_map.get(filepath);
});
exports.getAliCloudId = getAliCloudId;
const video_store = new Map();
const getYoutubeVidoInfo = (url) => {
    const videoId = youapi.parseVideoId(url);
    if (!video_store.has(videoId)) {
        video_store.set(videoId, youapi.getMediaInfo(videoId));
    }
    return video_store.get(videoId);
};
exports.getYoutubeVidoInfo = getYoutubeVidoInfo;
