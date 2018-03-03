// @flow
/* eslint no-continue: 0 */

import fs from 'fs';
import path from './path';
import * as Message from './message';
import type {
  Message as MessageType,
} from './message';
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
  content: string
  // children: Array<ParseResult>
};
export type ParseResults = Array<ParseResult>;

export type PathInfo = {
  repositoryName: ?string,
  path: string
};

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
    this.body = buffer.body;
  }

  async load(): Promise<[?MetaData, MessageType]> {
    if (this.isSimilarFile() || this.isSimilarDirectory()) {
      try {
        fs.statSync(this.absolutePath);
      } catch (e) {
        // TODO: 無名ファイルにする処理
        await this.moveNamelessFile();
        return [null, Message.success('')];
      }
    }

    if (this.isSimilarFile()) {
      this.isLoaded = true;
    } else if (this.isSimilarDirectory()) {
      const loadDirResult = await this._loadDirectory();
      if (Message.isSimilarError(loadDirResult)) {
        return [null, Message.wrap(loadDirResult)];
      }
    } else if (this.itemType === ItemTypeUndefined) {
      this.isLoaded = true;
    } else {
      return [null, Message.error(`MetaData.load unexpected item type: absolutePath=${this.absolutePath} itemType=${this.itemType}`)
      ];
    }

    return [this, Message.success('')];
  }

  async moveNamelessFile() {
    const promiseAll = this.children().map(async (item) => {
      const r = await item.moveNamelessFile();
      return r;
    });
    await Promise.all(promiseAll);

    await this.repository().moveNamelessFile(this.id);
  }

  async addFile(itemName: string, content: string = ''): Promise<[?MetaData, MessageType]> {
    const itemType = detectItemType(itemName);
    if (!isSimilarFile(itemType)) {
      return [
        null,
        Message.fail(`MetaData.addFile isSimilarFile check itemName=${itemName}`)
      ];
    }

    if (content === '' && itemType === ItemTypeMarkdown) {
      content = `# ${itemName.replace(/(.+?)\..+?$/, '$1')}`; // eslint-disable-line
    }

    const [ret, message] = await this._addItem(itemType, itemName);
    if (ret == null || Message.isSimilarError(message)) {
      return [ret, Message.wrap(message)];
    }

    try {
      fs.writeFileSync(ret.absolutePath, content);
    } catch (e) {
      return [null, Message.error(`MetaData.addDirectory mkdir error. ${e.message}`)];
    }

    return [ret, message];
  }

  async addDirectory(itemName: string): Promise<[?MetaData, MessageType]> {
    if (!this.isSimilarDirectory()) {
      return [
        null,
        Message.fail('MetaData.addDirectory isSimilarDirectory error')
      ];
    }

    if (!isSimilarDirectory(detectItemType(itemName))) {
      return [
        null,
        Message.fail('MetaData.addDirectory.isSimilarFile')
      ];
    }

    const [ret, message] = await this._addItem(ItemTypeDirectory, itemName);
    if (ret == null || Message.isSimilarError(message)) {
      return [ret, message];
    }

    try {
      fs.mkdirSync(ret.absolutePath);
    } catch (e) {
      if (e.code !== 'EEXIST') {
        return [
          null,
          Message.fail(`MetaData.addDirectory mkdir error. ${e.message}`)
        ];
      }
    }

    return [ret, message];
  }

  async move(pathInfo: PathInfo): Promise<Message.Message> {
    if (this.itemType === ItemTypeRepository) {
      return Message.error(`MetaData.move itemType=${this.itemType}`);
    }
    if (!path.isAbsolute(pathInfo.path)) {
      return Message.fail(`MetaData.move path check path=${pathInfo.path}`);
    }
    const itemType = detectItemType(pathInfo.path);
    // $FlowFixMe
    if (isSimilarFile(itemType) ^ this.isSimilarFile()) { // eslint-disable-line no-bitwise
      return Message.fail(`MetaData.move itemType check. pathInfo=${itemType}`);
    }
    // $FlowFixMe
    if (isSimilarDirectory(itemType) ^ this.isSimilarDirectory()) { // eslint-disable-line no-bitwise
      return Message.fail(`MetaData.move itemType check. pathInfo=${itemType}`);
    }
    if (itemType === ItemTypeUndefined) {
      return Message.fail(`MetaData.move itemType check path=${pathInfo.path}`);
    }

    const repositoryName = pathInfo.repositoryName || this.repositoryName;
    const repo = getInstance().find(repositoryName);
    if (repo == null) {
      return Message.error(`MetaData.move repository error. repostiroyName=${repositoryName}`);
    }

    const item = repo.getItemByPath(pathInfo.path);
    if (item != null) {
      return Message.error(`MetaData.move MetaData check path=${pathInfo.path}`);
    }
    try {
      fs.statSync(path.join(repo.absolutePath, pathInfo.path));
      return Message.error('MetaData.move stat error');
    } catch (_) {} // eslint-disable-line no-empty

    await this.repository().unwatch(this);

    const src = this.absolutePath;

    this.repositoryName = repositoryName;
    this.path = pathInfo.path;
    this.absolutePath = path.join(repo.absolutePath, this.path);
    this.repositoryPath = repo.absolutePath;
    this.name = path.basename(this.path);
    this.itemType = itemType;

    const dst = this.absolutePath;

    await repo.watch(this);

    try {
      fs.rename(src, dst);
    } catch (e) {
      return Message.error(`MetaData.move rename error. ${e.message}`);
    }

    return Message.success('File renamed');
  }

  childItem(name: string): ?MetaData {
    return this.children().find((item) => {
      return item.name === name;
    });
  }

  *getIDs(): Iterable<MetaDataID> {
    const ret = [this.id];
    yield this.id;
    for (let i = 0; i < this.childrenIDs.length; i += 1) {
      const child = this.repository().getItemByID(this.childrenIDs[i]);
      if (child == null) {
        continue;
      }
      // eslint-disable-next-line no-restricted-syntax
      for (const n of child.getIDs()) {
        ret.push(n);
        yield n;
      }
    }
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

    return !!this.path.match(path.join(path.sep, searchPath));
  }

  async parse(): Promise<[?ParseResult, MessageType]> {
    const [content, metaDataID, message] = await this.getContent();
    if (Message.isSimilarError(message)) {
      return [null, Message.wrap(message)];
    }

    let metaData;
    if (this.id === metaDataID) {
      metaData = this;
    } else {
      metaData = this.children().find((item) => {
        return item.id === metaDataID;
      });
      if (metaData == null) {
        return [null, Message.fail(`MetaData.parse child item not found metaDataID=${metaDataID}`)];
      }
    }

    const ret = await parse(metaData, content);

    return ret;
  }

  async updateContent(content: string): Promise<MessageType> {
    if (!this.isSimilarFile()) {
      return Message.fail(`MetaData.updateContent itemType check. path=${this.path} itemType=${this.itemType}`);
    }

    try {
      fs.writeFileSync(this.absolutePath, content);
    } catch (e) {
      return Message.error(`MetaData.updateContent error. ${e.message}`);
    }

    return Message.success('');
  }

  async getContent(): Promise<[string, MetaDataID, MessageType]> {
    if (!this.isSimilarFile() && !this.isSimilarDirectory()) {
      return ['', '', Message.fail(`MetaData.getContent itemType check. path=${this.path} itemType=${this.itemType}`)];
    }

    let ret = '';
    let metaDataID = '';
    if (this.isSimilarFile()) {
      ret = await this._getFileContent();
      metaDataID = this.id;
    } else if (this.isSimilarDirectory()) {
      [ret, metaDataID] = await this._getDirectoryContent();
    }

    return [ret, metaDataID, Message.success('')];
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
      body: this.body,
    };
  }

  async _addItem(itemType: ItemType, itemName: string): Promise<[?MetaData, MessageType]> {
    if (!isValidItemName(itemName)) {
      return [null, Message.fail(`MetaData._addItem.isValidItemName ${itemName}`)];
    }

    if (this.isExist(itemName)) {
      return [null, Message.fail('MetaData._addItem isExist check')];
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
      body: '',
    });
    this.childrenIDs.push(ret.id);
    this.repository().addMetaData(ret);

    return [ret, Message.success('')];
  }


  async _getFileContent(): Promise<string> {
    const ret = await readFile(this);

    return ret;
  }

  async _getDirectoryContent(): Promise<[string, MetaDataID]> {
    let directoryIndexItem = this.childItem('index.md');
    if (directoryIndexItem != null) {
      const r = await readFile(directoryIndexItem);
      return [r, directoryIndexItem.id];
    }
    directoryIndexItem = this.childItem('index.txt');
    if (directoryIndexItem != null) {
      const r = await readFile(directoryIndexItem);
      return [r, directoryIndexItem.id];
    }
    directoryIndexItem = this.childItem('index.html');
    if (directoryIndexItem != null) {
      const r = await readFile(directoryIndexItem);
      return [r, directoryIndexItem.id];
    }

    const ret = await getDirectoryContent(this);

    return [ret, this.id];
  }

  async _readdir(): Promise<[Array<string>, MessageType]> {
    const ret = await _readdir(this.absolutePath);

    return ret;
  }

  async _loadDirectory(): Promise<MessageType> {
    const [childNames, readdirResult] = await this._readdir();
    if (Message.isSimilarError(readdirResult)) {
      await this.moveNamelessFile();
      return Message.wrap(readdirResult);
    }

    const beforeIDs = this.childrenIDs.slice();

    const currentChildren = this.children();
    const promiseAll = childNames.map(async (childName) => {
      const childItem = currentChildren.find((item) => {
        return item.name === childName;
      });
      if (childItem != null) {
        const [_, loadResult] = await childItem.load();
        if (!Message.isSimilarError(loadResult.type)) {
          return [null, Message.wrap(loadResult)];
        }

        return [childItem, Message.success('')];
      }

      const [newItem, addResult] = await this._addItem(detectItemType(childName), childName);
      if (Message.isSimilarError(addResult)) {
        return [null, Message.wrap(addResult)];
      }
      if (newItem != null) {
        const [_, newItemLoadResult] = await newItem.load();
        if (Message.isSimilarError(newItemLoadResult)) {
          return [null, Message.wrap(newItemLoadResult)];
        }
      }

      return [newItem, Message.success('')];
    });

    const results = await Promise.all(promiseAll);
    const errorResult = results.find(([_, result]) => {
      return !Message.isSimilarError(result);
    });
    if (errorResult != null) {
      return Message.wrap(errorResult[1]);
    }

    this.childrenIDs = results.map(([item, _]) => {
      if (item == null) {
        return null;
      }

      return item.id;
    }).filter(Boolean);

    const afterIDs = this.childrenIDs.slice();
    // なくなったファイルを無名ファイルにしたい
    const namelessPromiseAll = beforeIDs.filter((beforeID) => {
      return !afterIDs.some((afterID) => {
        return afterID === beforeID;
      });
    }).map(async (id) => {
      const r = await this.repository().moveNamelessFile(id);
      return r;
    });
    await Promise.all(namelessPromiseAll);

    this.isLoaded = true;

    return Message.success('');
  }
}

async function _readdir(absolutePath: string): Promise<[Array<string>, MessageType]> {
  let ret: Array<string>;
  try {
    ret = fs.readdirSync(absolutePath).map((item) => {
      return item.normalize();
    });
  } catch (e) {
    return [[], Message.error(`metadata._readdir error: ${e.message}`)];
  }

  return [ret, Message.success('')];
}

export function detectItemType(name: string): ItemType {
  let ext = path.extname(name);
  if (ext === '' && name.match(/\./)) {
    ext = name;
  }

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
  const pathInfo = resolveInternalPath(itemPath);

  return `${pathInfo.repositoryName || repositoryName}:${pathInfo.path}`;
}

export function resolveInternalPath(itemPath: string): PathInfo {
  const split = itemPath.split(':', 2);
  let repositoryName: ?string;
  let retPath: string;
  if (split.length === 2) {
    [repositoryName, retPath] = split;
  } else {
    [retPath] = split;
  }

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

function matchItemName(name: string, itemName: string): boolean {
  if (name === '' || name === '.') {
    return true;
  }

  const searchName = path.join(path.sep, name);

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

async function readFile(metaData: MetaData): Promise<string> {
  let ret = '';
  try {
    ret = fs.readFileSync(metaData.absolutePath, 'utf8');
  } catch (e) {
    ret = `
# not found

${metaData.internalPath()}
`;
  }

  return ret;
}

async function parse(metaData: MetaData, content: string): Promise<[?ParseResult, MessageType]> {
  let parseResult:ParseResult = { content: '', children: [] };
  switch (metaData.itemType) {
  case ItemTypeMarkdown: {
    parseResult = await Markdown.parse(metaData.toBuffer(), content, getInstance());
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
    parseResult = await TableParser.parse(metaData.toBuffer(), content, { delimiter: ',' }, getInstance());
    break;
  }
  case ItemTypeTSV: {
    parseResult = await TableParser.parse(metaData.toBuffer(), content, { delimiter: '\t' }, getInstance());
    break;
  }
  case ItemTypeDirectory: {
    parseResult = await Markdown.parse(metaData.toBuffer(), content, getInstance());
    break;
  }
  case ItemTypeRepository: {
    parseResult = await Markdown.parse(metaData.toBuffer(), content, getInstance());
    break;
  }
  default:
    return [null, Message.fail('parseFile itemType trap default')];
  }

  return [parseResult, Message.success('')];
}

async function getDirectoryContent(metaData: MetaData): Promise<string> {
  const [directoryItems, readdirResult] = await _readdir(metaData.absolutePath);
  if (Message.isSimilarError(readdirResult.type)) {
    return `
# not found

${metaData.internalPath()}
`;
  }

  const items:Array<string> = directoryItems.map((filename) => {
    if (filename.type === Message.MessageTypeInfo) {
      return null;
    }

    return `- [[${internalPath(metaData.repositoryName, filename)}]]{${filename}}`;
  }).filter(Boolean); // nullを消したい

  const md = `
# ${metaData.name}

${items.join('\n')}
  `;

  return md;
}
