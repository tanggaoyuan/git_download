import path from 'path';
import Pool from './Pool';
import ffmpeg from 'fluent-ffmpeg';
import Listener from './Listener';

const pool = new Pool(2);

class GitMerge extends Listener {
  private readonly promise: Promise<string>;

  constructor(
    parmas: {
      fragments: string[];
      save_dir_path: string;
      file_name: string;
    },
    mode: 'MergeVideo' | 'MergeAudio',
  ) {
    super('merge');
    this.promise = pool.enqueue(() => {
      this.notifyStatus('pending');

      if (mode === 'MergeVideo') {
        const [audioPath, videoPath] = parmas.fragments;
        return new Promise((resolve, reject) => {
          const save_path = path.join(
            parmas.save_dir_path,
            `${parmas.file_name}.mp4`,
          );
          ffmpeg()
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
      } else if (mode === 'MergeAudio') {
        const [audioPath] = parmas.fragments;
        return new Promise((resolve, reject) => {
          const save_path = path.join(
            parmas.save_dir_path,
            `${parmas.file_name}.mp3`,
          );
          ffmpeg()
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
      } else {
        return Promise.resolve({});
      }
    });
  }

  wait() {
    return this.promise;
  }
}

export default GitMerge;
