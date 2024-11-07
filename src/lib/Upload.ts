import Listener from './Listener';
import Pool from './Pool';
import { aliUpload } from './Tool';

const pool = new Pool(3);

class GitUpload extends Listener {
  private readonly promise: Promise<any>;

  constructor(filepath: string, cloud_path_id: string) {
    super('upload');
    this.promise = pool.enqueue(async () => {
      try {
        this.notifyStatus('pending');
        const response = await aliUpload(filepath, cloud_path_id, (value) => {
          this.notifyProgress(value);
        });
        this.notifyStatus('done');
        return response;
      } catch (error) {
        this.notifyStatus('done');
      }
    });
  }

  wait() {
    return this.promise;
  }
}

export default GitUpload;
