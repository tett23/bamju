// @flow

import path from './path';
import {
  type Message,
  MessageTypeFailed,
  MessageTypeSucceeded,
} from './util';

type ID = string;

export type Buffer = {
  id: ID,
  name: string,
  path: string,
  repositoryName: string,
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

export const ItemTypeRepository = 'repository';
export const ItemTypeDirectory = 'directory';
export const ItemTypeMarkdown = 'markdown';
export const ItemTypeText = 'text';
export const ItemTypeCSV = 'csv';
export const ItemTypeTSV = 'tsv';
export const ItemTypeHTML = 'html';
export const ItemTypeUndefined = 'undefined';
export type ItemType = 'repository' | 'directory' | 'markdown' | 'text' | 'csv' | 'tsv' | 'html' | 'undefined';

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

  static async addFile(repositoryName: string, filePath: string): Promise<[?MetaData, Message]> {
    const rootItem = RepositoryManager.find(repositoryName);
    if (rootItem == null) {
      return [null, {
        type: MessageTypeFailed,
        message: ''
      }];
    }

    return await rootItem.addFile(filePath);
  }

  static find(repositoryName: string): ?MetaData {
    return _repositories.find((item) => {
      return item.repositoryName === repositoryName;
    });
  }
}

function createRootBuffer(repositoryName: string, absolutePath: string): Buffer {
  return {
    id: createID(),
    name: '/',
    path: '/',
    repositoryName,
    absolutePath,
    itemType: ItemTypeRepository,
    projectPath: absolutePath,
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

function createID(): ID {
  return `${Math.random()}`;
}

export class FileItem {
}

export class MetaData {
  id: ID;
  name: string;
  path: string;
  repositoryName: string;
  absolutePath: string;
  itemType: ItemType;
  parent: ?Buffer;
  children: Array<MetaData>;
  isLoaded: boolean;
  isOpened: boolean;

  constructor(buffer: Buffer, parent: ?MetaData = null) {
    this.id = buffer.id;
    if (this.id === '') {
      this.id = createID();
    }
    this.name = buffer.name;
    this.path = buffer.path;
    this.repositoryName = buffer.repositoryName;
    this.absolutePath = buffer.absolutePath;
    this.itemType = buffer.itemType;
    this.parent = parent;
    this.children = buffer.children.map((c) => {
      return new MetaData(c, this);
    });
    this.isLoaded = buffer.isLoaded;
    this.isOpened = buffer.isOpened;
  }

  async addFile(itemPath: string): Promise<[?MetaData, Message]> {
    if (!path.isAbsolute(itemPath)) {
      return [null, {
        type: MessageTypeFailed,
        message: '',
      }];
    }

    if (!isValidItemType(itemPath)) {
      return [null, {
        type: MessageTypeFailed,
        message: ''
      }];
    }

    if (this.detect(itemPath) == null) {
      return [null, {
        type: MessageTypeFailed,
        message: ''
      }];
    }

    return [this.detect(itemPath), {
      type: MessageTypeSucceeded,
      message: '',
    }];
  }

  detect(name: string): ?MetaData {
    const search = path.normalize(name);
    let current:MetaData;
    if (name.match(/^\//)) {
      current = this.rootItem();
    } else if (name.match(/^\./)) {
      current = this;
    } else {
      current = this.rootItem();
    }

    return detectInner(search, current);
  }

  rootItem(): MetaData {
    if (this.itemType === ItemTypeRepository || this.path === '/') {
      return this;
    }

    const ret = RepositoryManager.detect(this.repositoryName, '/');

    if (ret == null) {
      throw new Error(`MetaData.rootItem rootItem not found. repositoryName=${this.repositoryName}`);
    }

    return ret;
  }
}

export function detectItemType(name: string): ItemType {
  const ext = path.extname(name);

  switch (ext) {
  case '.md': return ItemTypeMarkdown;
  case '.txt': return ItemTypeText;
  case '.csv': return ItemTypeCSV;
  case '.tsv': return ItemTypeTSV;
  case '.html': return ItemTypeHTML;
  case '': return ItemTypeDirectory;
  default: return ItemTypeUndefined;
  }
}

function isValidItemType(filename: string): boolean {
  const itemType = detectItemType(filename);

  switch (itemType) {
  case ItemTypeMarkdown: return true;
  case ItemTypeText: return true;
  case ItemTypeCSV: return true;
  case ItemTypeTSV: return true;
  case ItemTypeHTML: return true;
  default: return false;
  }
}

function detectInner(pathString: string, metaData: MetaData): ?MetaData {
  if (pathString === '..') {
    if (metaData.itemType === ItemTypeRepository) {
      return metaData;
    }

    if (metaData.parent == null) {
      return null;
    }
  }
  if (pathString === '..' && metaData.parent == null) {
    return null;
  }

  if (matchItemName(pathString, metaData.path)) {
    return metaData;
  }

  let ret:?MetaData;
  metaData.children.some((item) => {
    if (matchItemName(pathString, item.path)) {
      ret = item;
      return true;
    }

    ret = detectInner(pathString, item);
    if (ret != null) {
      return true;
    }

    return false;
  });

  return ret;
}

function matchItemName(searchName: string, itemName: string): boolean {
  if (searchName === '' || searchName === '.') {
    return true;
  }

  if (itemName.match(searchName)) {
    return true;
  }

  if (itemName.match(`${searchName}.md`)) {
    return true;
  }

  if (itemName.match(`${searchName}.txt`)) {
    return true;
  }

  if (itemName.match(`${searchName}.csv`)) {
    return true;
  }

  if (itemName.match(`${searchName}.tsv`)) {
    return true;
  }

  return false;
}

export default RepositoryManager;
