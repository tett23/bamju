// @flow

import fs from 'fs';
import path from './path';
import {
  type Message,
  MessageTypeFailed,
  MessageTypeError,
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
import {
  Markdown,
} from '../main/parser/markdown';
import {
  Table as TableParser,
} from '../main/parser/table';

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

export type ParseResult = {
  content: string,
  children: Array<ParseResult>
};
export type ParseResults = Array<ParseResult>;

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
  body: string;

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
    this.body = buffer.body;
  }

  async load(): Promise<[?MetaData, Message]> {
    if (this.isSimilarFile() || this.isSimilarDirectory()) {
      try {
        fs.statSync(this.absolutePath);
      } catch (e) {
        // TODO: 無名ファイルにする処理
        return [null, {
          type: MessageTypeSucceeded,
          message: ''
        }];
      }
    }

    if (this.isSimilarFile()) {
      this.isLoaded = true;
    } else if (this.isSimilarDirectory()) {
      const loadDirResult = await this._loadDirectory();
      if (loadDirResult.type !== MessageTypeSucceeded) {
        return [null, loadDirResult];
      }
    } else {
      return [null, {
        type: MessageTypeError,
        message: `MetaData.load unexpected item type: absolutePath=${this.absolutePath} itemType=${this.itemType}`
      }];
    }

    return [this, {
      type: MessageTypeSucceeded,
      message: ''
    }];
  }

  async addFile(itemName: string, content: string): Promise<[?MetaData, Message]> {
    if (!isSimilarFile(detectItemType(itemName))) {
      return [null, {
        type: MessageTypeFailed,
        message: `MetaData.addFile isSimilarFile check itemName=${itemName}`
      }];
    }

    const [ret, message] = await this._addItem(detectItemType(itemName), itemName);
    if (ret == null || message.type === MessageTypeFailed) {
      return [ret, message];
    }

    try {
      fs.writeFileSync(ret.absolutePath, content);
    } catch (e) {
      return [null, {
        type: MessageTypeError,
        message: `MetaData.addDirectory mkdir error. ${e.message}`
      }];
    }

    return [ret, message];
  }

  async addDirectory(itemName: string): Promise<[?MetaData, Message]> {
    if (!this.isSimilarDirectory()) {
      return [null, {
        type: MessageTypeFailed,
        message: 'MetaData.addDirectory isSimilarDirectory error'
      }];
    }

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

  async parse(): Promise<[?ParseResult, Message]> {
    try {
      fs.statSync(this.absolutePath);
    } catch (e) {
      const r = await parseResultNotFound(this);
      return [r, {
        type: MessageTypeError,
        message: `MetaData.parse error: ${e.message}`
      }];
    }

    if (this.isSimilarFile()) {
      return this._parseFile();
    } else if (this.isSimilarDirectory()) {
      return this._parseDirectory();
    }

    const ret = await parseResultNotFound(this);
    return [ret, {
      type: MessageTypeError,
      message: 'MetaData.parse unexpected error'
    }];
  }

  async updateContent(content: string): Promise<Message> {
    if (!this.isSimilarFile()) {
      return {
        type: MessageTypeFailed,
        message: `MetaData.updateContent itemType check. path=${this.path} itemType=${this.itemType}`
      };
    }

    try {
      fs.writeFileSync(this.absolutePath, content);
    } catch (e) {
      return {
        type: MessageTypeError,
        message: `MetaData.updateContent error. ${e.message}`
      };
    }

    return {
      type: MessageTypeSucceeded,
      message: ''
    };
  }

  async getContent(): Promise<[string, Message]> {
    if (!this.isSimilarFile()) {
      return ['', {
        type: MessageTypeFailed,
        message: `MetaData.getContent itemType check. path=${this.path} itemType=${this.itemType}`
      }];
    }

    let ret = '';
    try {
      ret = fs.readFileSync(this.absolutePath, 'utf8');
    } catch (e) {
      return ['', {
        type: MessageTypeSucceeded,
        message: `MetaData.getContent readFile error: ${e.message}`
      }];
    }

    return [ret, {
      type: MessageTypeSucceeded,
      message: ''
    }];
  }

  async open(): Promise<MetaData> {
    await this.load();

    this.isOpened = true;

    return this;
  }

  close(): MetaData {
    this.isOpened = false;

    return this;
  }

  internalPath(): string {
    return internalPath(this.repositoryName, this.path);
  }

  toBuffer(): Buffer {
    return {
      id: this.id,
      name: this.name,
      path: this.path,
      repositoryName: this.repositoryName,
      repositoryPath: this.repositoryPath,
      absolutePath: this.absolutePath,
      itemType: this.itemType,
      parentID: this.parentID,
      childrenIDs: this.childrenIDs,
      isLoaded: this.isLoaded,
      isOpened: this.isOpened,
      body: this.body,
    };
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
      body: '',
    });
    this.childrenIDs.push(ret.id);
    this.repository().addMetaData(ret);

    return [ret, {
      type: MessageTypeSucceeded,
      message: '',
    }];
  }

  async _parseFile(): Promise<[?ParseResult, Message]> {
    const ret = await parseFile(this);

    return ret;
  }

  async _parseDirectory(): Promise<[?ParseResult, Message]> {
    let directoryIndexItem = this.childItem('index.md');
    if (directoryIndexItem != null) {
      const r = await parseFile(directoryIndexItem);
      return r;
    }
    directoryIndexItem = this.childItem('index.txt');
    if (directoryIndexItem != null) {
      const r = await parseFile(directoryIndexItem);
      return r;
    }
    directoryIndexItem = this.childItem('index.html');
    if (directoryIndexItem != null) {
      const r = await parseFile(directoryIndexItem);
      return r;
    }

    const ret = await parseDirectory(this);

    return ret;
  }

  async _readdir(): Promise<[Array<string>, Message]> {
    const ret = await _readdir(this.absolutePath);

    return ret;
  }

  async _loadDirectory(): Promise<Message> {
    const [childNames, readdirResult] = await this._readdir();
    if (readdirResult.type !== MessageTypeSucceeded) {
      return readdirResult;
    }

    const currentChildren = this.children();
    const promiseAll = childNames.map(async (childName) => {
      const childItem = currentChildren.find((item) => {
        return item.name === childName;
      });
      if (childItem != null) {
        const [_, loadResult] = await childItem.load();
        if (loadResult.type !== MessageTypeSucceeded) {
          return [null, loadResult];
        }

        return [childItem, {
          type: MessageTypeSucceeded,
          message: ''
        }];
      }

      const [newItem, addResult] = await this._addItem(detectItemType(childName), childName);
      if (addResult.type !== MessageTypeSucceeded) {
        return [null, addResult];
      }
      if (newItem != null) {
        const [_, newItemLoadResult] = await newItem.load();
        if (newItemLoadResult.type !== MessageTypeSucceeded) {
          return [null, newItemLoadResult];
        }
      }

      return [newItem, {
        type: MessageTypeSucceeded,
        message: ''
      }];
    });

    const results = await Promise.all(promiseAll);
    const errorResult = results.find(([_, result]) => {
      return result.type !== MessageTypeSucceeded;
    });
    if (errorResult != null) {
      return errorResult[1];
    }

    this.childrenIDs = results.map(([item, _]) => {
      if (item == null) {
        return null;
      }

      return item.id;
    }).filter(Boolean);

    this.isLoaded = true;

    return {
      type: MessageTypeSucceeded,
      message: ''
    };
  }
}

async function _readdir(absolutePath: string): Promise<[Array<string>, Message]> {
  let ret: Array<string>;
  try {
    ret = fs.readdirSync(absolutePath);
  } catch (e) {
    return [[], {
      type: MessageTypeError,
      message: `metadata._readdir error: ${e.message}`
    }];
  }

  return [ret, {
    type: MessageTypeSucceeded,
    message: ''
  }];
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

export function internalPath(repositoryName: string, itemPath: string): string {
  return `${repositoryName}:${itemPath}`;
}

export function resolveInternalPath(itemPath: string): {repositoryName: ?string, path: string} {
  const split = itemPath.split(':', 2);
  let repositoryName: ?string;
  let retPath: string;
  if (split.length === 2) {
    [repositoryName, retPath] = split;
  } else {
    [retPath] = split;
  }

  retPath = path.join('/', retPath);

  return {
    repositoryName,
    path: retPath
  };
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

async function parseResultNotFound(metaData: MetaData): Promise<ParseResult> {
  const md: string =
`
# not found

${metaData.internalPath()}
`;

  const ret = await Markdown.parse(metaData, md);

  return ret;
}

async function parseFile(metaData: MetaData): Promise<[?ParseResult, Message]> {
  const [content, message] = await metaData.getContent();
  if (message.type !== MessageTypeSucceeded) {
    return [null, message];
  }

  let parseResult:ParseResult = { content: '', children: [] };
  switch (metaData.itemType) {
  case ItemTypeMarkdown: {
    parseResult = await Markdown.parse(metaData, content);
    break;
  }
  case ItemTypeText: {
    parseResult.content = content;
    break;
  }
  case ItemTypeHTML: {
    parseResult.content = content;
    break;
  }
  case ItemTypeCSV: {
    parseResult = await TableParser.parse(metaData, content, [], { delimiter: ',' });
    break;
  }
  case ItemTypeTSV: {
    parseResult = await TableParser.parse(metaData, content, [], { delimiter: '\t' });
    break;
  }
  default:
    return [null, {
      type: MessageTypeFailed,
      message: 'parseFile itemType trap default'
    }];
  }

  return [parseResult, {
    type: MessageTypeSucceeded,
    message: ''
  }];
}

async function parseDirectory(metaData: MetaData): Promise<[?ParseResult, Message]> {
  const [directoryItems, readdirResult] = await _readdir(metaData.absolutePath);
  if (readdirResult.type !== MessageTypeSucceeded) {
    return [null, readdirResult];
  }

  const items:Array<string> = directoryItems.map((filename) => {
    if (isValidItemName(filename) === ItemTypeUndefined) {
      return null;
    }

    return `- [[${internalPath(metaData.repositoryName, filename)}]]{${filename}}`;
  }).filter(Boolean); // nullを消したい

  const md = `
# ${metaData.name}

${items.join('\n')}
  `;

  const ret = await Markdown.parse(metaData, md);

  return [ret, {
    type: MessageTypeSucceeded,
    message: ''
  }];
}
