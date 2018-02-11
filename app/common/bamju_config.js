/* eslint no-empty: 0 */
// @flow

import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';
import {
  getInstance as getRepositoryManagerInstance,
} from './repository_manager';
import {
  type RepositoryConfig,
} from './repository';
import {
  type Buffer,
} from './buffer';
import {
  type WindowConfig,
  type WindowID,
} from './window';

export type Config = {
  repositories: RepositoryConfig[],
  windows: WindowConfig[],
  config: {
    followChange: boolean,
    mkdirP: boolean
  },
  bufferItems: {[string]: Buffer[]}
};

export const defaultConfig:Config = {
  repositories: [],
  windows: [{
    id: 'init',
    rectangle: {
      x: 100,
      y: 100,
      width: 1024,
      height: 728
    },
    tabs: []
  }],
  bufferItems: {},
  config: {
    followChange: true,
    mkdirP: true
  },
};

let _instance: BamjuConfig;

export function getInstance() {
  return _instance;
}

export class BamjuConfig {
  _configPath: string;
  _config: Config;
  _quit: boolean;

  constructor(configPath: string) {
    this._configPath = configPath;
    this._quit = false;
    try {
      fs.statSync(configPath);
    } catch (e) {
      fs.writeFileSync(configPath, '{}');
    }

    const json = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    this._config = this._merge(json);

    _instance = this;
  }

  getConfig(): Config {
    return this._config;
  }

  toJSON(): string {
    return JSON.stringify(this._config, null, 2);
  }

  async update(values: Object = {}) {
    if (this._quit) {
      return;
    }

    this._config = this._merge(values);
    await this._updateConfigFile();
  }

  async quit() {
    try {
      this._config.bufferItems = getRepositoryManagerInstance().toBuffers();
      this._config.repositories = getRepositoryManagerInstance().getRepositories().map((repo) => {
        return repo.toConfig();
      });
    } catch (_) {
    }

    await this._updateConfigFile();

    this._quit = true;
  }

  findWindowConfig(id: string): ?WindowConfig {
    return this._config.windows.find((item) => {
      return id === item.id;
    });
  }

  async replaceWindow(win: WindowConfig): Promise<void> {
    const idx = this._config.windows.findIndex((w) => {
      return w.id === win.id;
    });
    if (idx === -1) {
      this._config.windows.push(win);
      return;
    }

    this._config.windows[idx] = win;

    await this.update();
  }

  async addWindow(win: WindowConfig): Promise<void> {
    const c = this.findWindowConfig(win.id);
    if (c) {
      return;
    }

    this._config.windows.push(win);
    await this.update();
  }

  async removeWindow(id: WindowID): Promise<void> {
    const idx = this._config.windows.findIndex((w) => {
      return w.id === id;
    });
    if (idx === -1) {
      return;
    }

    this._config.windows.splice(idx, 1);

    await this.update();
  }

  async addRepository(repo: RepositoryConfig) {
    const isExist = this._config.repositories.some((r) => {
      return r.repositoryName === repo.repositoryName && r.absolutePath === repo.absolutePath;
    });
    if (isExist) {
      return;
    }

    this._config.repositories.push(repo);
  }

  async removeRepository(repositoryName: string, absolutePath: string) {
    const idx = this._config.repositories.findIndex((r) => {
      return r.repositoryName === repositoryName && r.absolutePath === absolutePath;
    });
    if (idx === -1) {
      return;
    }

    this._config.repositories.splice(idx, 1);
  }

  _merge(values: Object): Config {
    return Object.assign({}, defaultConfig, this._config, values);
  }

  async _updateConfigFile() {
    if (this._quit) {
      return;
    }

    try {
      fs.statSync(path.dirname(this._configPath));
    } catch (e) {
      await mkdirp(path.dirname(this._configPath), 0o755);
    }

    fs.writeFileSync(this._configPath, this.toJSON(), { mode: 0o644 });
  }
}

export default BamjuConfig;
