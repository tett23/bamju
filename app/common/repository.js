// @flow
/* eslint no-continue: 0 */

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
    id: createID(),
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
  repositoryPath: string;
  absolutePath: string;
  itemType: ItemType;
  parent: ?MetaData;
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
    this.repositoryPath = buffer.repositoryPath;
    this.absolutePath = buffer.absolutePath;
    this.itemType = buffer.itemType;
    this.parent = parent;
    this.children = buffer.children.map((c) => {
      return new MetaData(c, this);
    });
    this.isLoaded = buffer.isLoaded;
    this.isOpened = buffer.isOpened;
  }

  async addFile(itemName: string): Promise<[?MetaData, Message]> {
    if (!isSimilarFile(itemName)) {
      return [null, {
        type: MessageTypeFailed,
        message: `MetaData.addFile.isSimilarFile itemName=${itemName}`
      }];
    }

    return this._addItem(detectItemType(itemName), itemName);
  }

  async addDirectory(itemName: string): Promise<[?MetaData, Message]> {
    if (!isSimilarDirectory(itemName)) {
      return [null, {
        type: MessageTypeFailed,
        message: 'MetaData.addDirectory.isSimilarFile'
      }];
    }

    return this._addItem(ItemTypeDirectory, itemName);
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

  isExist(name: string): boolean {
    return this.childItem(name) != null;
  }

  childItem(name: string): ?MetaData {
    return this.children.find((item) => {
      return item.name === name;
    });
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

  isSimilarFile(): boolean {
    return isSimilarFile(this.itemType);
  }

  isSimilarDirectory(): boolean {
    return isSimilarDirectory(this.itemType);
  }

  async _addItem(itemType: ItemType, itemName: string): Promise<[?MetaData, Message]> {
    if (!isValidItemName(itemName)) {
      return [null, {
        type: MessageTypeFailed,
        message: 'MetaData._addItem.isValidItemName'
      }];
    }

    if (itemType === ItemTypeUndefined) {
      return [null, {
        type: MessageTypeFailed,
        message: 'MetaData._addItem.ItemTypeUndefined'
      }];
    }

    if (this.isExist(itemName)) {
      return [null, {
        type: MessageTypeFailed,
        message: 'MetaData._addItem.isExist'
      }];
    }

    const ret = new MetaData({
      id: createID(),
      name: itemName,
      path: path.join(this.path, itemName),
      repositoryName: this.repositoryName,
      repositoryPath: this.repositoryPath,
      absolutePath: path.join(this.absolutePath, itemName),
      itemType,
      parent: null,
      children: [],
      isLoaded: false,
      isOpened: false,
    }, this);
    this.children.push(ret);

    return [ret, {
      type: MessageTypeSucceeded,
      message: '',
    }];
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


function isSimilarFile(filename: string): boolean {
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

function isSimilarDirectory(filename: string): boolean {
  const itemType = detectItemType(filename);

  switch (itemType) {
  case ItemTypeRepository: return true;
  case ItemTypeDirectory: return true;
  default: return false;
  }
}

function isValidItemName(name: string): boolean {
  if (name.match(path.sep)) {
    return false;
  }

  return true;
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
