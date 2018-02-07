// @flow

import fs from 'fs';
import path from './path';
import {
  type Message,
  MessageTypeFailed,
  MessageTypeSucceeded,
} from './util';
import {
  getInstance
} from './repository_manager';
import {
  Repository
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
  parentID: ?MetaDataID;
  childrenIDs: Array<MetaDataID>;
  isLoaded: boolean;
  isOpened: boolean;

  constructor(buffer: Buffer) {
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
    this.parentID = buffer.parentID;
    this.childrenIDs = buffer.childrenIDs;
    this.isLoaded = buffer.isLoaded;
    this.isOpened = buffer.isOpened;
  }

  async addFile(itemName: string): Promise<[?MetaData, Message]> {
    if (!isSimilarFile(detectItemType(itemName))) {
      return [null, {
        type: MessageTypeFailed,
        message: `MetaData.addFile isSimilarFile check itemName=${itemName}`
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

    const [ret, message] = await this._addItem(ItemTypeDirectory, itemName);
    if (ret == null || message.type === MessageTypeFailed) {
      return [ret, message];
    }

    try {
      fs.mkdirSync(ret.absolutePath);
    } catch (e) {
      if (e.code !== 'EEXIST') {
        return [null, {
          type: MessageTypeFailed,
          message: `MetaData.addDirectory mkdir error. ${e.message}`
        }];
      }
    }

    return [ret, message];
  }

  childItem(name: string): ?MetaData {
    return this.children().find((item) => {
      return item.name === name;
    });
  }

  getIDs(): Array<MetaDataID> {
    const ret:Array<MetaDataID> = [this.id];
    this.children().forEach((child) => {
      child.getIDs().forEach((id) => {
        ret.push(id);
      });
    });

    return ret;
  }

  parent(): ?MetaData {
    const { parentID } = this;
    if (this.path === '/') {
      return this;
    }
    if (parentID == null) {
      return null;
    }

    return this.repository().getItemByID(parentID);
  }

  children(): Array<MetaData> {
    const repo = this.repository();

    const ret:Array<MetaData> = [];
    this.childrenIDs.forEach((childID: string) => {
      const item:?MetaData = repo.getItemByID(childID);

      if (item != null) {
        ret.push(item);
      }
    });

    return ret;
  }

  repository(): Repository {
    const repo = getInstance().find(this.repositoryName);
    if (repo == null) {
      throw new Error();
    }

    return repo;
  }

  detect(name: string): ?MetaData {
    if (name === '/') {
      return this.repository().rootItem();
    }
    if (name === '.') {
      return this;
    }
    if (name === '..' && this.path === '/') {
      return this;
    }

    return detectInner(name, this);
  }

  isExist(name: string): boolean {
    return this.children().find((item) => {
      return item.name === name;
    }) != null;
  }

  isSimilarFile(): boolean {
    return isSimilarFile(this.itemType);
  }

  isSimilarDirectory(): boolean {
    return isSimilarDirectory(this.itemType);
  }

  isMatchPath(searchPath: string): boolean {
    if (searchPath.startsWith('/')) {
      if (this.isSimilarFile()) {
        return this.path.startsWith(searchPath) && matchItemName(searchPath, this.path);
      }

      return this.path === searchPath;
    }

    if (this.isSimilarFile()) {
      return matchItemName(searchPath, this.path);
    }

    return !!this.path.match(searchPath);
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
        message: 'MetaData._addItem isExist check'
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
      parentID: this.id,
      childrenIDs: [],
      isLoaded: false,
      isOpened: false,
    });
    this.childrenIDs.push(ret.id);
    this.repository().addMetaData(ret);

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
  const normalizedPath = path.normalize(pathString);
  if (normalizedPath === metaData.path) {
    return metaData;
  }

  if (normalizedPath === '/') {
    return metaData.repository().rootItem();
  }

  if (normalizedPath === '.' || normalizedPath === './') {
    return metaData;
  }

  if ((normalizedPath === '..' || normalizedPath === '../')) {
    const parent = metaData.parent();
    if (parent != null) {
      return parent;
    }

    return metaData.repository().rootItem();
  }

  if (matchItemName(normalizedPath, metaData.path)) {
    return metaData;
  }

  let ret:?MetaData;
  metaData.children().some((item) => {
    if (matchItemName(normalizedPath, item.path)) {
      ret = item;
      return true;
    }

    ret = detectInner(normalizedPath, item);
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

  if (itemName === searchName) {
    return true;
  }

  if (itemName.endsWith(searchName)) {
    return true;
  }

  if (itemName.endsWith(`${searchName}.md`)) {
    return true;
  }

  if (itemName.endsWith(`${searchName}.txt`)) {
    return true;
  }

  if (itemName.endsWith(`${searchName}.csv`)) {
    return true;
  }

  if (itemName.endsWith(`${searchName}.tsv`)) {
    return true;
  }

  return false;
}
