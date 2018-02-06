// @flow

import path from './path';
import {
  type Message,
  MessageTypeFailed,
  MessageTypeSucceeded,
} from './util';
import {
  RepositoryManager
} from './repository';
import {
  type Buffer,
} from './buffer';

export const ItemTypeRepository = 'repository';
export const ItemTypeDirectory = 'directory';
export const ItemTypeMarkdown = 'markdown';
export const ItemTypeText = 'text';
export const ItemTypeCSV = 'csv';
export const ItemTypeTSV = 'tsv';
export const ItemTypeHTML = 'html';
export const ItemTypeUndefined = 'undefined';
export type ItemType = 'repository' | 'directory' | 'markdown' | 'text' | 'csv' | 'tsv' | 'html' | 'undefined';

export type MetaDataID = string;

export class MetaData {
  id: MetaDataID;
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
      this.id = createMetaDataID();
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
    if (!isSimilarFile(detectItemType(itemName))) {
      return [null, {
        type: MessageTypeFailed,
        message: `MetaData.addFile.isSimilarFile itemName=${itemName}`
      }];
    }

    return this._addItem(detectItemType(itemName), itemName);
  }

  async addDirectory(itemName: string): Promise<[?MetaData, Message]> {
    if (!isSimilarDirectory(detectItemType(itemName))) {
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
        message: `MetaData._addItem.isValidItemName ${itemName}`
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
      id: createMetaDataID(),
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

export function createMetaDataID(): MetaDataID {
  return `${Math.random()}`;
}

export function isSimilarFile(itemType: ItemType): boolean {
  switch (itemType) {
  case ItemTypeMarkdown: return true;
  case ItemTypeText: return true;
  case ItemTypeCSV: return true;
  case ItemTypeTSV: return true;
  case ItemTypeHTML: return true;
  default: return false;
  }
}

export function isSimilarDirectory(itemType: ItemType): boolean {
  switch (itemType) {
  case ItemTypeRepository: return true;
  case ItemTypeDirectory: return true;
  default: return false;
  }
}

export function isValidItemName(name: string): boolean {
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
