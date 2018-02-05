// @flow

export type Buffer = {
};

type RepositoryConfig = Array<{
  repositoryName: string,
  absolutePath: string
}>;

let _repositories:Array<MetaData> = [];

export class RepositoryManager {
  static async init(buffers: Array<Buffer>, config: RepositoryConfig): Promise<Array<MetaData>> {
    const ret = buffers.map((buffer) => {
      return new MetaData(buffer);
    });

    _repositories = ret;

    return ret;
  }
}


export class FileItem {

}

export class MetaData {
  constructor(buffer: Buffer) {

  }
}

export default RepositoryManager;
