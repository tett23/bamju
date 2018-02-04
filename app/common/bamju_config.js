/* eslint no-underscore-dangle: 0 */
// @flow

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import mkdirp from 'mkdirp';
import expandHomeDir from 'expand-home-dir';
import {
  Manager,
  type BufferItem
} from './project';

export type BamjuConfig = {
  projects: {
    [string]: string
  },
  windows: Windows,
  followChange: boolean,
  config: {
    mkdirP: boolean
  },
  bufferItems: Array<BufferItem>,
  init: () => Promise<void>,
  update: ({}) => Promise<void>,
  quit: () => void
};

export type Window = {
  id: string,
  rectangle: {
    x: number,
    y: number,
    width: number,
    height: number
  },
  tabs: [{
    buffer: {
      projectName: string,
      path: string
    }
  }]
};
export type Windows = Array<Window>;

export const defaultConfig:BamjuConfig = {
  projects: {
    'bamju-specifications': '/Users/tett23/projects/bamju-specifications',
  },
  windows: [{
    id: 'init',
    rectangle: {
      x: 100,
      y: 100,
      width: 1024,
      height: 728
    },
    tabs: [
      {
        buffer: {
          projectName: '',
          path: ''
        }
      }
    ]
  }],
  bufferItems: [],
  followChange: true,
  config: {
    mkdirP: true
  },
  init(): Promise<void> {
    return loadConfigFile().then((conf) => {
      return merge(conf);
    }).catch(() => {});
  },
  update(values: {}) {
    merge(values);

    return updateConfigFile();
  },
  quit() {
    Config.bufferItems = Manager.getBufferItems();

    fs.writeFileSync(configPath, JSON.stringify(Config, null, 2), { mode: 0o644 });
    _quit = true;
  }
};

let _quit:boolean = false;

function merge(values: {}) {
  Object.keys(values).forEach((k: string) => {
    Config[k] = values[k];
  });
}

let p:string = '~/.config/bamju/config.json';
if (process.platform === 'windows') {
  p = '~\\AppData\\Local\\bamju\\config.json';
}
const configPath:string = expandHomeDir(p);

async function updateConfigFile(): Promise<void> {
  if (_quit) {
    return;
  }

  try {
    await promisify(fs.stat)(path.dirname(configPath));
  } catch (e) {
    await mkdirp(path.dirname(configPath), 0o755);
  }

  await promisify(fs.writeFile)(configPath, JSON.stringify(Config, null, 2), { mode: 0o644 });
}

async function loadConfigFile(): Promise<BamjuConfig> {
  try {
    await promisify(fs.stat)(configPath);
  } catch (e) {
    console.log('loadConfigFile error: ', e);
    return defaultConfig;
  }

  const buf:Buffer = await promisify(fs.readFile)(configPath);
  const conf:string = buf.toString('UTF-8');

  const json = JSON.parse(conf);

  return Object.assign({}, defaultConfig, json);
}

export function findWindowConfig(id: string): ?Window {
  const ret:?Window = Config.windows.find((item: Window): boolean => {
    return id === item.id;
  });
  if (ret === null || ret === undefined) {
    return ret;
  }

  return Object.assign({}, ret);
}

export async function replaceWindowConfig(win: Window): Promise<void> {
  const u:Array<Window> = [];
  Config.windows.concat([]).forEach((c: Window) => {
    if (c.id === win.id) {
      u.push(Object.assign({}, win));
      return;
    }

    u.push(c);
  });

  await Config.update({
    windows: u
  });
}

export async function addWindowConfig(win: Window): Promise<void> {
  const c:?Window = findWindowConfig(win.id);
  if (c) {
    return;
  }

  const u:Array<Window> = Config.windows.concat([]);
  u.push(Object.assign({}, win));

  await Config.update({
    windows: u
  });
}

export async function removeWindowConfig(id: string): Promise<void> {
  const u:Array<Window> = [];
  Config.windows.concat([]).forEach((c: Window) => {
    if (c.id === id) {
      return;
    }

    u.push(c);
  });

  await Config.update({
    windows: u
  });
}

export const Config:BamjuConfig = Object.assign({}, defaultConfig);
Config.init();

export default Config;
