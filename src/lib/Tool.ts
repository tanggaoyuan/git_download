import { YoutubeApi, AliCloudApi, LocalCache, Wrapper } from 'base_api/node';
// import { HttpsProxyAgent } from 'https-proxy-agent';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { type PassThrough } from 'stream';

export const DOWNLOAD_STORE_PATH = path.join(process.cwd(), 'download');

export const DOWNLOAD_ASSET_PATH = path.join(DOWNLOAD_STORE_PATH, 'assets');
fs.mkdirSync(DOWNLOAD_ASSET_PATH, { recursive: true });

export const ALI_TOKEN_PATH = path.join(DOWNLOAD_STORE_PATH, 'token.json');

export const DOWNLOAD_LIST_PATH = path.join(
  DOWNLOAD_STORE_PATH,
  'download.json',
);

const local = new LocalCache(path.join(DOWNLOAD_STORE_PATH, 'http_cache.json'));

const youapi = new YoutubeApi({
  localCache: local,
  request: Wrapper.wrapperAxios(axios),
  // agent: new HttpsProxyAgent('http://127.0.0.1:7890'),
});

const aliapi = new AliCloudApi({
  localCache: local,
  request: Wrapper.wrapperAxios(axios),
});

export const youtubeDownload = async (
  info: any,
  mode: 'video' | 'audio',
  onProgress?: (progress: number) => void,
) => {
  const { title } = info;
  const { mp4s, webms, m4as = [] } = mode === 'audio' ? info.audio : info.video;
  let index = 0;
  let stream: PassThrough;
  let err: Error;
  let format: any;

  const save_dir_path = path.join(DOWNLOAD_ASSET_PATH, info.videoId);

  fs.mkdirSync(save_dir_path, { recursive: true });

  while (!stream && index < 10) {
    for (const item of [m4as[index], mp4s[index], webms[index]]) {
      if (!item) {
        continue;
      }
      try {
        index++;
        stream = await youapi.downloadSource(item, (data) => {
          onProgress && onProgress(data.progress || 0);
        });
        format = item;
        break;
      } catch (error) {
        err = error;
      }
    }
  }
  if (!stream && err) {
    return Promise.reject(err);
  }

  const save_file_path = path.join(
    save_dir_path,
    `${title}_${mode}.${format.ext}`,
  );
  const file = fs.createWriteStream(save_file_path);
  stream.pipe(file);

  await new Promise((resolve, reject) => {
    stream.on('error', reject);
    stream.on('close', resolve);
  });

  return {
    file_name: title,
    save_dir_path,
    save_file_path,
  };
};

const getAliRequestParams = async () => {
  const parmas = JSON.parse(fs.readFileSync(ALI_TOKEN_PATH, 'utf-8'));
  if (new Date(parmas.token_expire_time).getTime() < Date.now()) {
    const newtoken = await aliapi
      .refreshToken(parmas.app_id, parmas.refresh_token)
      .getData();
    parmas.refresh_token = newtoken.refresh_token;
    parmas.token = newtoken.access_token;
    parmas.token_expire_time = newtoken.expire_time;
    fs.writeFileSync(ALI_TOKEN_PATH, JSON.stringify(parmas), 'utf-8');
  }
  return aliapi.generateRequestParams(parmas);
};

export const aliUpload = async (
  filepath: string,
  cloud_path_id: string,
  onprogress?: (value: number) => void,
) => {
  const params = await getAliRequestParams();
  return aliapi.uploadFile(
    {
      source_path: filepath,
      parent_file_id: cloud_path_id,
      check_name_mode: 'auto_rename',
    },
    params,
    (data) => {
      onprogress && onprogress(data.progress || 0);
    },
  );
};

const cloud_map = new Map<string, Promise<string>>();
export const getAliCloudId = async (filepath: string) => {
  if (!filepath) {
    return 'root';
  }
  const handle = async () => {
    const parent_path = filepath.split('/');
    const current_path = parent_path.pop();
    const parent_file_id = await getAliCloudId(parent_path.join('/'));
    const parmas = await getAliRequestParams();
    const { items = [] } = await aliapi
      .searchFile(
        {
          parent_file_id,
          name: current_path,
        },
        parmas,
      )
      .getData();
    let id = items.find((item) => item.name === current_path)?.file_id;
    if (!id) {
      const response = await aliapi
        .createDir(
          {
            parent_file_id,
            name: current_path,
          },
          parmas,
        )
        .getData();
      id = response.file_id;
    }
    return id;
  };
  if (!cloud_map.has(filepath)) {
    cloud_map.set(filepath, handle());
  }
  return cloud_map.get(filepath);
};

const video_store = new Map<
  string,
  Promise<{
    method: string;
    video: {
      mp4s: any[];
      webms: any[];
    };
    audio: {
      mp4s: any[];
      m4as: any[];
      webms: any[];
    };
    title: string;
    videoId: string;
  }>
>();
export const getYoutubeVidoInfo = (url: string) => {
  const videoId = youapi.parseVideoId(url);
  if (!video_store.has(videoId)) {
    video_store.set(videoId, youapi.getMediaInfo(videoId));
  }
  return video_store.get(videoId);
};
