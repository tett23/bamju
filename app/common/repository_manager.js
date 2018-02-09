// @flow

import {
  type Message,
  MessageTypeSucceeded,
  MessageTypeFailed,
  MessageTypeError,
} from './util';
import {
  MetaData,
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

  constructor(bufferItems: initBuffer, config: Array<RepositoryConfig>) {
    this._repositories = [];
    config.forEach((conf) => {
      let items: Array<Buffer> = [];
      Object.keys(bufferItems).some((key) => {
        if (bufferItems[key] != null) {
          items = bufferItems[key];
          return true;
        }

        return false;
      });

      const [_, result] = this.addRepository(conf, items);
      if (result.type !== MessageTypeSucceeded) {
        throw new Error(result.message);
      }
    });

    _instance = this;
  }

  async loadRepositories(): Promise<Repository[]> {
    const promiseAll = this._repositories.map(async (repo) => {
      await repo.load();

      return repo;
    });

    const ret = await Promise.all(promiseAll);

    return ret;
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

  detect(repositoryName: string, itemName: string, current: ?MetaData = null): ?MetaData {
    const repo = this.find(repositoryName);
    if (repo == null) {
      return null;
    }

    return repo.detect(itemName, current);
  }

  addRepository(conf: RepositoryConfig, items: Array<Buffer> = []): [?Repository, Message] {
    if (this.find(conf.repositoryName)) {
      return [null, {
        type: MessageTypeFailed,
        message: `RepositoryManager.addRepository duplicate entry. ${conf.repositoryName}`
      }];
    }

    const isExist = this._repositories.some((item) => {
      return item.absolutePath === conf.absolutePath;
    });
    if (isExist === true) {
      return [null, {
        type: MessageTypeFailed,
        message: `RepositoryManager.addRepository absolutePath check. ${conf.absolutePath}`
      }];
    }

    let repo: Repository;
    try {
      repo = new Repository(items, conf);
    } catch (e) {
      return [null, {
        type: MessageTypeError,
        message: `RepositoryManager.addRepository error: absolutePath=${conf.absolutePath}. ${e.message}`
      }];
    }

    this._repositories.push(repo);

    return [repo, {
      type: MessageTypeSucceeded,
      message: ''
    }];
  }

  removeRepository(repositoryName: string): ?Repository {
    const removeIndex = this._repositories.findIndex((item) => {
      return item.name === repositoryName;
    });

    if (removeIndex === -1) {
      return null;
    }

    const ret = this._repositories[removeIndex];
    this._repositories.splice(removeIndex, 1);

    return ret;
  }

  toBuffers(): {[string]: Array<Buffer>} {
    const ret = {};
    this._repositories.forEach((item) => {
      ret[item.name] = item.toBuffers();
    });

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
