// @flow

import path from './path';
import {
  type Message,
  MessageTypeFailed,
  MessageTypeSucceeded,
} from './util';
import {
  MetaData,
  ItemTypeRepository,
} from './metadata';
import {
  Repository,
  type RepositoryConfig
} from './repository';
import {
  type Buffer,
} from './buffer';

type initBuffer = {
  [string]: Array<Buffer>
};

export class RepositoryManager {
  _repositories: Array<Repository>

  constructor(buffers: initBuffer, config: Array<RepositoryConfig>) {
    const repositories = config.map((conf) => {
      let init: Array<Buffer> = [];
      Object.keys(buffers).some((key) => {
        const items = buffers[key];
        if (items) {
          init = items;
        }

        return items != null;
      });

      return new Repository(init, conf);
    });

    this._repositories = repositories;
    _instance = this;
  }

  getRepositories(): Array<Repository> {
    return this._repositories;
  }

  find(repositoryName: string): ?Repository {
    return this._repositories.find((repo) => {
      return repo.name === repositoryName;
    });
  }

  isExist(repositoryName: string): boolean {
    return this.find(repositoryName) != null;
  }

  detect(repositoryName: string, itemName: string): ?MetaData {
    const repo = this.find(repositoryName);
    if (repo == null) {
      return null;
    }

    return repo.detect(itemName);
  }

  async addFile(repositoryName: string, filePath: string): Promise<[?MetaData, Message]> {
    const repo = this.find(repositoryName);
    if (repo == null) {
      return [null, {
        type: MessageTypeFailed,
        message: 'RepositoryManager.addFile repo null check',
      }];
    }

    const ret = await repo.addFile(filePath);

    return ret;
  }

  async addDirectory(repositoryName: string, dirPath: string): Promise<[?MetaData, Message]> {
    const repo = this.find(repositoryName);
    if (repo == null) {
      return [null, {
        type: MessageTypeFailed,
        message: 'RepositoryManager.addDirectrory repo null check',
      }];
    }

    const ret = await repo.addDirectory(dirPath);

    return ret;
  }
}

let _instance:?RepositoryManager = null;

export function getInstance(): RepositoryManager {
  if (_instance == null) {
    throw new Error();
  }

  return _instance;
}
