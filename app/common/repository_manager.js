// @flow

import * as Message from './message';
import {
  MetaData,
  type MetaDataID,
  resolveInternalPath,
} from './metadata';
import {
  Repository,
  type RepositoryConfig
} from './repository';
import {
  type Buffer,
} from './buffer';

export class RepositoryManager {
  _repositories: Array<Repository>

  constructor(buffers: Buffer[], config: Array<RepositoryConfig>) {
    this._repositories = [];
    config.forEach((conf) => {
      const items = buffers.filter((item) => {
        return item.repositoryName === conf.repositoryName;
      });

      const [_, result] = this.addRepository(conf, items);
      if (Message.isSimilarError(result)) {
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

  getItemByID(metaDataID: MetaDataID): ?MetaData {
    let ret = null;
    this._repositories.some((repo) => {
      ret = repo.getItemByID(metaDataID);

      return false;
    });

    return ret;
  }

  detect(repositoryName: string, internalPath: string, current: ?MetaData = null): ?MetaData {
    const info = resolveInternalPath(internalPath);
    const repoName = info.repositoryName || repositoryName;

    const repo = this.find(repoName);
    if (repo == null) {
      return null;
    }

    return repo.detect(info.path, current);
  }

  addRepository(conf: RepositoryConfig, items: Array<Buffer> = []): [?Repository, Message.Message] {
    if (this.find(conf.repositoryName)) {
      return [null, Message.fail(`RepositoryManager.addRepository duplicate entry. ${conf.repositoryName}`)];
    }

    const isExist = this._repositories.some((item) => {
      return item.absolutePath === conf.absolutePath;
    });
    if (isExist === true) {
      return [null, Message.fail(`RepositoryManager.addRepository absolutePath check. ${conf.absolutePath}`)];
    }

    let repo: Repository;
    try {
      repo = new Repository(items, conf);
    } catch (e) {
      return [null, Message.error(`RepositoryManager.addRepository error: absolutePath=${conf.absolutePath}. ${e.message}`)];
    }

    this._repositories.push(repo);

    return [repo, Message.success('')];
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

  toBuffers(): Buffer[] {
    const ret = this._repositories.reduce((r, item) => {
      return r.concat(item.toBuffers());
    }, []);

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
