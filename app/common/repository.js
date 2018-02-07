// @flow
/* eslint no-continue: 0 */

import path from './path';
import {
  type Buffer,
} from './buffer';
import {
  MetaData,
  type MetaDataID,
  createMetaDataID,
  ItemTypeRepository
} from './metadata';
import {
  type Message,
  MessageTypeFailed,
  MessageTypeSucceeded,
} from './util';

export type RepositoryConfig = {
  repositoryName: string,
  absolutePath: string
};

export const a = '';

export class Repository {
  name: string;
  absolutePath: string;
  items: Array<MetaData>;

  constructor(buffers: Array<Buffer>, config: RepositoryConfig) {
    this.name = config.repositoryName;
    this.absolutePath = config.absolutePath;
    if (buffers.length === 0) {
      this.items = [new MetaData(createRootBuffer(config.repositoryName, config.absolutePath))];
    } else {
      this.items = buffers.map((buf) => {
        return new MetaData(buf);
      });
    }
  }

  loadItems(items: Array<MetaData>) {
    this.items = items;
  }

  find(itemPath: string): ?MetaData {
    return this.items.find((item) => {
      return item.path === itemPath;
    });
  }

  detect(name: string, current: ?MetaData = null): ?MetaData {
    const searchPath = path.normalize(name);

    if (searchPath === '/') {
      return this.rootItem();
    }

    let targetItem:MetaData;
    if (current == null) {
      targetItem = this.rootItem();
    } else {
      targetItem = current;
    }

    let matchItems;
    if (searchPath.match(/^\//)) {
      matchItems = this._getItems(searchPath, this.rootItem().getIDs());
    }
    if (searchPath.match(/^\./)) {
      matchItems = this._getItems(searchPath, targetItem.getIDs());
    } else {
      matchItems = this._getItems(searchPath, targetItem.getIDs());
      if (matchItems.length === 0) {
        matchItems = this._getItems(searchPath, this.rootItem().getIDs());
      }
    }

    return matchItems[0];
  }

  _getItems(searchPath: string, targetIDs: Array<MetaDataID>): Array<MetaData> {
    const matchIDs = targetIDs.filter((targetID) => {
      const item = this.getItemByID(targetID);
      if (item == null) {
        return false;
      }

      return item.isMatchPath(searchPath);
    });

    const ret = [];
    matchIDs.forEach((id) => {
      const item = this.getItemByID(id);
      if (item != null) {
        ret.push(item);
      }
    });

    return ret;
  }

  getItemByID(id: MetaDataID): ?MetaData {
    const ret = this.items.find((item) => {
      return item.id === id;
    });

    if (ret == null) {
      return null;
    }

    return ret;
  }

  rootItem(): MetaData {
    const ret = this.items.find((item) => {
      return item.path === '/';
    });

    if (ret == null) {
      throw new Error();
    }

    return ret;
  }

  addMetaData(metaData: MetaData): number {
    return this.items.push(metaData);
  }

  async addFile(filePath: string): Promise<[?MetaData, Message]> {
    const normalizedPath = path.normalize(filePath);
    if (!path.isAbsolute(normalizedPath)) {
      return [null, {
        type: MessageTypeFailed,
        message: `RepositoryManager.addFile.isAbsolute ${normalizedPath}`,
      }];
    }

    const parentPath = path.dirname(normalizedPath);
    const [_, addDirectoryResult] = await this.addDirectory(parentPath);
    if (addDirectoryResult.type !== MessageTypeSucceeded) {
      return [null, addDirectoryResult];
    }

    const parentItem = this.getItemByPath(parentPath);
    if (parentItem == null) {
      return [null, {
        type: MessageTypeFailed,
        message: `RepositoryManager.addFile.isExist ${parentPath}`,
      }];
    }

    const itemName = path.basename(normalizedPath);
    const [metaData, message] = await parentItem.addFile(itemName);

    return [metaData, message];
  }

  async addDirectory(dirPath: string): Promise<[?MetaData, Message]> {
    if (!path.isAbsolute(dirPath)) {
      return [null, {
        type: MessageTypeFailed,
        message: 'RepositoryManager.addDirectory.isAbsolute',
      }];
    }

    const [createdItems, message] = await _mkdir(path.normalize(dirPath), this.rootItem());
    if (message.type === MessageTypeFailed) {
      return [null, message];
    }

    if (createdItems.length === 0) {
      return [null, {
        type: MessageTypeFailed,
        message: 'RepositoryManager.addDirectory.isAbsolute',
      }];
    }

    const ret = createdItems[createdItems.length - 1];

    return [ret, message];
  }

  getItemByPath(itemPath: string): ?MetaData {
    return this.items.find((item) => {
      return item.path === itemPath;
    });
  }
}

async function _mkdir(dirPath: string, parentItem: MetaData): Promise<[Array<MetaData>, Message]> {
  const pathItems = path.split(path.normalize(dirPath));
  if (pathItems.length === 0) {
    return [[], {
      type: MessageTypeFailed,
      message: 'RepositoryManager._mkdirP isSimilarFile'
    }];
  }

  const ret:Array<MetaData> = [];
  let currentItem = parentItem;
  for (let i = 0; i < pathItems.length; i += 1) {
    if (!currentItem.isSimilarDirectory()) {
      return [[], {
        type: MessageTypeFailed,
        message: '_mkdir check parent directory type error',
      }];
    }

    const name = pathItems[i];
    const child = currentItem.childItem(name);
    if (child != null) {
      ret.push(child);
      currentItem = child;
      continue;
    }

    const [createItem, message] = await currentItem.addDirectory(name);
    if (createItem == null) {
      return [[], message];
    }
    if (message.type !== MessageTypeSucceeded) {
      return [[], message];
    }

    ret.push(createItem);

    currentItem = createItem;
  }

  return [ret, {
    type: MessageTypeSucceeded,
    message: ''
  }];
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
    parentID: null,
    childrenIDs: [],
  };
}
//
// function loadBufferItems(buffers: Array<Buffer>): Array<MetaData> {
//   return buffers.map((buf) => {
//     return new MetaData(buf, null);
//   });
// }
