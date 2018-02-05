// @flow
/* eslint no-continue: 0 */

import path from './path';
import {
  type Message,
  MessageTypeFailed,
  MessageTypeSucceeded,
} from './util';
import {
  MetaData,
  type MetaDataID,
  type ItemType,
  createMetaDataID,
  ItemTypeRepository,
} from './metadata';


export type Buffer = {
  id: MetaDataID,
  name: string,
  path: string,
  repositoryName: string,
  repositoryPath: string,
  absolutePath: string,
  itemType: ItemType,
  parent: ?Buffer,
  children: Array<Buffer>,
  isLoaded: boolean,
  isOpened: boolean
};

type RepositoryConfig = Array<{
  repositoryName: string,
  absolutePath: string
}>;

let _repositories:Array<MetaData> = [];

export class RepositoryManager {
  static init(buffers: Array<Buffer>, config: RepositoryConfig): Array<MetaData> {
    const initItems = config.map(({ repositoryName, absolutePath }) => {
      let buffer = buffers.find((buf) => {
        return buf.repositoryName === repositoryName;
      });

      if (buffer == null) {
        buffer = createRootBuffer(repositoryName, absolutePath);
      }

      return buffer;
    });

    _repositories = loadBufferItems(initItems);

    return _repositories;
  }

  static detect(repositoryName: string, itemName: string): ?MetaData {
    const rootItem = RepositoryManager.find(repositoryName);
    if (rootItem == null) {
      return null;
    }

    return rootItem.detect(itemName);
  }
  static isExist(repositoryName: string, itemName: string): boolean {
    return RepositoryManager.detect(repositoryName, itemName) != null;
  }

  static async addFile(repositoryName: string, filePath: string, options: {recursive: boolean} = { recursive: true }): Promise<[?MetaData, Message]> {
    if (!path.isAbsolute(filePath)) {
      return [null, {
        type: MessageTypeFailed,
        message: 'RepositoryManager.addFile.isAbsolute',
      }];
    }

    const rootItem = RepositoryManager.find(repositoryName);
    if (rootItem == null) {
      return [null, {
        type: MessageTypeFailed,
        message: 'RepositoryManager.addFile.rootItem',
      }];
    }

    const dirPath = path.dirname(path.normalize(filePath));
    if (options.recursive) {
      const [_, addDirectoryResult] = await RepositoryManager.addDirectory(repositoryName, dirPath, options);

      if (addDirectoryResult.type !== MessageTypeSucceeded) {
        return [null, addDirectoryResult];
      }
    }

    const parentItem = RepositoryManager.detect(repositoryName, dirPath);
    if (parentItem == null) {
      return [null, {
        type: MessageTypeFailed,
        message: `RepositoryManager.addFile.isExist ${dirPath}`,
      }];
    }

    const itemName = path.basename(filePath);
    const ret = await parentItem.addFile(itemName);

    return ret;
  }

  static async addDirectory(
    repositoryName: string,
    dirPath: string,
    options: {recursive: boolean} = { recursive: true }
  ): Promise<[?MetaData, Message]> {
    if (!path.isAbsolute(dirPath)) {
      return [null, {
        type: MessageTypeFailed,
        message: 'RepositoryManager.addDirectory.isAbsolute',
      }];
    }

    const rootItem = RepositoryManager.find(repositoryName);
    if (rootItem == null) {
      return [null, {
        type: MessageTypeFailed,
        message: 'RepositoryManager.addDirectrory rootItem null check',
      }];
    }

    let ret: [?MetaData, Message];
    if (options.recursive) {
      ret = await _mkdirP(dirPath, rootItem);
    } else {
      ret = await _mkdir(dirPath, rootItem);
    }

    return ret;
  }

  static find(repositoryName: string): ?MetaData {
    return _repositories.find((item) => {
      return item.repositoryName === repositoryName;
    });
  }
}

function createRootBuffer(repositoryName: string, absolutePath: string): Buffer {
  return {
    id: createMetaDataID(),
    name: '/',
    path: '/',
    repositoryName,
    repositoryPath: absolutePath,
    absolutePath,
    itemType: ItemTypeRepository,
    isLoaded: false,
    isOpened: false,
    children: [],
    parent: null,
  };
}

function loadBufferItems(buffers: Array<Buffer>): Array<MetaData> {
  return buffers.map((buf) => {
    return new MetaData(buf, null);
  });
}

export class FileItem {
}

async function _mkdirP(dirPath: string, targetItem: MetaData): Promise<[?MetaData, Message]> {
  const pathItems = path.split(dirPath);
  let currentItem:MetaData = targetItem;
  for (let i = 0; i < pathItems.length; i += 1) {
    const name = pathItems[i];

    if (name === '') {
      continue;
    }

    const existItem = currentItem.childItem(name);
    if (existItem == null) {
      const [dir, message] = await _mkdir(name, currentItem);
      if (message.type === MessageTypeFailed) {
        return [dir, message];
      }

      currentItem = dir;
    } else if (existItem.isSimilarFile()) {
      return [null, {
        type: MessageTypeFailed,
        message: 'RepositoryManager._mkdirP isSimilarFile'
      }];
    } else if (existItem.isSimilarDirectory()) {
      currentItem = existItem;
    } else {
      return [null, {
        type: MessageTypeFailed,
        message: 'RepositoryManager.addDirectory.else',
      }];
    }
  }

  return [currentItem, {
    type: MessageTypeSucceeded,
    message: '',
  }];
}

async function _mkdir(dirName: string, targetItem: MetaData): Promise<[?MetaData, Message]> {
  if (targetItem.isExist(dirName)) {
    return [null, {
      type: MessageTypeFailed,
      message: `RepositoryManager._mkdir.isExist ${dirName}`,
    }];
  }

  const ret = await targetItem.addDirectory(dirName);

  return ret;
}

export default RepositoryManager;
