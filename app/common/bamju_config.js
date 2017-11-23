// @flow

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import mkdirp from 'mkdirp';
import expandHomeDir from 'expand-home-dir';

export type BamjuConfig = {
  projects: {
    [string]: string
  },
  windows: [{
    rectangle: {
      x: number,
      y: number,
      width: number,
      height: number
    },
    tabs: [{
      buffer: {
        projectName: ?string,
        path: ?string
      }
    }]
  }],
  followChange: boolean
  // init: () => Promise<void>,
  // update: ({}) => Promise<void>
};

const defaultConfig:BamjuConfig = {
  projects: {
    'bamju-specifications': '/Users/tett23/projects/bamju-specifications',
  },
  windows: [{
    rectangle: {
      x: 100,
      y: 100,
      width: 1024,
      height: 728
    },
    tabs: [
      {
        buffer: {
          projectName: undefined,
          path: undefined
        }
      }
    ]
  }],
  followChange: true,
  init: (): Promise<void> => loadConfigFile().then((conf) =>
    merge(conf)).catch(() => {}),
  update: (values: {}): Promise<void> => {
    merge(values);

    return updateConfigFile();
  }
};

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

  return Object.assign(defaultConfig, json);
}

const Config:BamjuConfig = Object.assign({}, defaultConfig);
Config.init();

export default Config;
