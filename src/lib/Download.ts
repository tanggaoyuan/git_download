import Listener from './Listener';
import Pool from './Pool';
import { getYoutubeVidoInfo, youtubeDownload } from './Tool';

const pool = new Pool(3);

class GitDownload extends Listener {
  private readonly promise: Promise<{
    file_name: string;
    save_dir_path: string;
    save_file_path: string;
  }>;

  constructor(url: string, mode: 'video' | 'audio') {
    super('download');
    this.promise = pool.enqueue(async () => {
      this.notifyStatus('pending');
      try {
        if (url.includes('youtu')) {
          const info = await getYoutubeVidoInfo(url);
          const resonse = await youtubeDownload(info, mode, (progress) => {
            this.notifyProgress(progress);
          });
          this.notifyStatus('done');
          return resonse;
        } else {
          this.notifyStatus('done');
          return Promise.resolve({});
        }
      } catch (error) {
        this.notifyStatus('done');
      }
    });
  }

  wait() {
    return this.promise;
  }
}

export default GitDownload;
