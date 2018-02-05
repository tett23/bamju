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
    return new MetaData(buf);
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
  children: Array<Buffer>;
  isLoaded: boolean;
  isOpened: boolean;

  constructor(buffer: Buffer) {
    this.id = buffer.id;
    if (this.id === '') {
      this.id = createID();
    }
    this.name = buffer.name;
    this.path = buffer.path;
    this.repositoryName = buffer.repositoryName;
    this.absolutePath = buffer.absolutePath;
    this.itemType = buffer.itemType;
    if (buffer.parent != null) {
      this.parent = new MetaData(buffer.parent);
    }
    this.children = buffer.children.map((c) => {
      return new MetaData(c);
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

  detect(path: string): ?MetaData {
    return true;
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

export default RepositoryManager;
