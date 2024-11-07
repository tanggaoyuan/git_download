import GitDownload from './lib/Download';
import GitMerge from './lib/Merge';
import {
  DOWNLOAD_ASSET_PATH,
  DOWNLOAD_LIST_PATH,
  getAliCloudId,
} from './lib/Tool';
import fs from 'fs';
import GitUpload from './lib/Upload';
import { MD5 } from 'request_chain/node';

const log: Record<
  string,
  {
    action: string;
    progress: number;
    status: 'wait' | 'pending' | 'done';
  }
> = {};

const main = async () => {
  const config = JSON.parse(fs.readFileSync(DOWNLOAD_LIST_PATH, 'utf-8'));

  const time = setInterval(() => {
    console.log(log);
  }, 2000);

  const tasks = config.urls.map(async (element) => {
    const task_key =
      element.name || (await MD5.getMd5(element?.url || element));

    if (typeof element === 'string') {
      //   const downloader = new GitDownload(element);
      // TODO
    } else {
      const mode = element.mode;

      const handleTask = async (downloads: GitDownload[]) => {
        const [audio, video] = await Promise.all(
          downloads.map((item) => item.wait()),
        );

        const merge = new GitMerge(
          {
            fragments: video
              ? [audio.save_file_path, video.save_file_path]
              : [audio.save_file_path],
            save_dir_path: audio.save_dir_path,
            file_name: audio.file_name,
          },
          video ? 'MergeVideo' : 'MergeAudio',
        );

        log[task_key + '_' + (video ? 'video' : 'audio')] = merge;

        const merg_info = await merge.wait();

        const dirname = audio.save_dir_path
          .replace(DOWNLOAD_ASSET_PATH, '')
          .replace(/\/|\\/g, '');
        const parent_file_id = await getAliCloudId(
          dirname ? `${config.cloud_path}/${dirname}` : config.cloud_path,
        );
        const upload = new GitUpload(merg_info, parent_file_id);
        log[task_key + '_' + (video ? 'video' : 'audio')] = upload;
        return upload.wait();
      };

      const downloads: GitDownload[] = [new GitDownload(element.url, 'audio')];

      const tasks: Array<Promise<any>> = [];
      if (mode === 'audio' || mode === 'all') {
        log[`${task_key}_audio`] = downloads[0];
        const promise = handleTask([...downloads]);
        tasks.push(promise);
      }
      if (mode === 'video' || mode === 'all') {
        downloads.push(new GitDownload(element.url, 'video'));
        log[`${task_key}_video`] = downloads[1];
        const promise = handleTask(downloads);
        tasks.push(promise);
      }
      await Promise.all(tasks);
    }
  });
  await Promise.all(tasks).finally(() => {
    clearInterval(time);
  });
};

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
