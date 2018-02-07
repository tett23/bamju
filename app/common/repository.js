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

  detect(name: string, current: ?MetaData = null): ?MetaData {
    const searchPath = path.normalize(name);

    let targetItem:MetaData;
    if (current == null) {
      targetItem = this.rootItem();
    } else {
      targetItem = current;
    }

    if (searchPath.match(/^\//)) {
      this._getItems(searchPath, this.rootItem().getIDs());
    } else if (searchPath.match(/^\./)) {
      this._getItems(searchPath, targetItem.getIDs());
    } else {
      this._getItems(searchPath, targetItem.getIDs());
      const ret = this._getItems(searchPath, targetItem.getIDs());
      if (ret != null) {
        return ret;
      }

      return this._getItems(searchPath, this.rootItem().getIDs());
    }
  }

  _getItems(searchPath: string, targetIDs: Array<MetaDataID>): ?MetaData {
    const id = targetIDs.find((targetID) => {
      const item = this.getItemByID(targetID);
      if (item == null) {
        return false;
      }

      return item.path.match(searchPath);
    });

    if (id == null) {
      return null;
    }

    return this.getItemByID(id);
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
    if (!path.isAbsolute(filePath)) {
      return [null, {
        type: MessageTypeFailed,
        message: 'RepositoryManager.addFile.isAbsolute',
      }];
    }

    const parentPath = path.dirname(path.normalize(filePath));
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

    const itemName = path.basename(filePath);
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

    return [createdItems[0], message];
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
        message: '',
      }];
    }

    const name = pathItems[i];
    if (currentItem.isExist(name)) {
      continue;
    }

    const [createItem, message] = await currentItem.addDirectory(name);
    if (createItem == null) {
      return [[], {
        type: MessageTypeFailed,
        message: '',
      }];
    }
    if (message.type !== MessageTypeSucceeded) {
      return [[], {
        type: MessageTypeFailed,
        message: ''
      }];
    }

    ret.push(createItem);

    currentItem = createItem;
  }

  return [ret, {
    type: MessageTypeSucceeded,
    message: ''
  }];

  // if (items.length === 0) {
  //   return [null, {
  //     type: MessageTypeFailed,
  //     message: 'RepositoryManager._mkdirP isSimilarFile'
  //   }];
  // }
  //
  //
  // const ret = items[items.length - 1];
  // if (ret == null) {
  //   return [null, {
  //     type: MessageTypeFailed,
  //     message: 'RepositoryManager._mkdirP isSimilarFile'
  //   }];
  // }
  //
  // if (ret.path != dirPath) {
  //   return [null, {
  //     type: MessageTypeFailed,
  //     message: 'RepositoryManager._mkdirP isSimilarFile'
  //   }];
  // }
  //
  // return [ret, {
  //   type: MessageTypeSucceeded,
  //   message: '',
  // }];

  // let currentItem:MetaData = targetItem;
  // for (let i = 0; i < pathItems.length; i += 1) {
  //   const name = pathItems[i];
  //
  //   if (name === '') {
  //     continue;
  //   }
  //
  //   const existItem = currentItem.childItem(name);
  //   if (existItem == null) {
  //     const [dir, message] = await currentItem.addDirectory(name);
  //     if (message.type === MessageTypeFailed) {
  //       return [dir, message];
  //     }
  //
  //     currentItem = dir;
  //   } else if (existItem.isSimilarFile()) {
  //     return [null, {
  //       type: MessageTypeFailed,
  //       message: 'RepositoryManager._mkdirP isSimilarFile'
  //     }];
  //   } else if (existItem.isSimilarDirectory()) {
  //     currentItem = existItem;
  //   } else {
  //     return [null, {
  //       type: MessageTypeFailed,
  //       message: 'RepositoryManager.addDirectory.else',
  //     }];
  //   }
  // }
  //
  // return [currentItem, {
  //   type: MessageTypeSucceeded,
  //   message: '',
  // }];
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
