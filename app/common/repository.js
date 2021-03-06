// @flow
/* eslint no-continue: 0 */

import fs from 'fs';

import path from './path';
import {
  type Buffer,
  emptyNote,
} from './buffer';
import {
  MetaData,
  type MetaDataID,
  createMetaDataID,
  ItemTypeMarkdown,
  ItemTypeRepository,
  detectItemType,
} from './metadata';
import * as Message from './message';

export type RepositoryConfig = {
  repositoryName: string,
  absolutePath: string
};

const configFilename = '.bamju';

type RepositoryMetaData = {
  repository: RepositoryConfig,
  buffers: Buffer[]
};

export class Repository {
  name: string;
  absolutePath: string;
  items: Array<MetaData>;

  constructor(buffers: Array<Buffer>, config: RepositoryConfig) {
    this.name = config.repositoryName;
    this.absolutePath = config.absolutePath;

    const stat = fs.statSync(config.absolutePath);
    if (!stat.isDirectory()) {
      throw new Error(`Repository.constructor stat error: ${config.absolutePath}`);
    }

    if (buffers.length === 0) {
      this.items = [new MetaData(createRootBuffer(config.repositoryName, config.absolutePath))];
    } else {
      this.items = buffers.map((buf) => {
        return new MetaData(buf);
      });
    }
  }

  async load(): Promise<[?Repository, Message.Message]> {
    const rootItem = this.rootItem();
    try {
      const stat = fs.statSync(rootItem.absolutePath);
      if (!stat.isDirectory()) {
        return [null, Message.fail(`Repository.load stat.isDirectory absolutePath=${rootItem.absolutePath}`)];
      }
    } catch (e) {
      return [null, Message.error(`Repository.load stat error: ${e.message}`)];
    }

    const promiseAll = this.items.map(async (item) => {
      const r = await item.load();
      return r;
    });
    const results = await Promise.all(promiseAll);

    const errorResult = results.find(([_, message]) => {
      return Message.isSimilarError(message);
    });
    if (errorResult != null) {
      return errorResult;
    }

    const writeMessage = await this.writeMetaDataFile();
    if (Message.isSimilarError(writeMessage)) {
      return [null, writeMessage];
    }

    return [this, Message.success('')];
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

    let matchItem = null;
    if (searchPath.match(/^\//)) {
      matchItem = this._getItem(searchPath, this.rootItem());
    }
    if (searchPath.match(/^\./)) {
      matchItem = this._getItem(searchPath, targetItem);
    } else {
      matchItem = this._getItem(searchPath, targetItem);
      if (matchItem == null) {
        matchItem = this._getItem(searchPath, this.rootItem());
      }
    }

    return matchItem;
  }

  async watch(metaData: MetaData) {
    const isExist = this.items.some((item) => {
      return item.id === metaData.id;
    });
    if (isExist) {
      return;
    }

    const [_parent, addDirectoryMessage] = await this.addDirectory(path.dirname(metaData.path));
    if (_parent == null || Message.isSimilarError(addDirectoryMessage)) {
      return Message.wrap(addDirectoryMessage);
    }

    metaData.parentID = _parent.id; // eslint-disable-line no-param-reassign
    metaData.repositoryName = this.name; // eslint-disable-line no-param-reassign
    metaData.repositoryPath = this.absolutePath; // eslint-disable-line no-param-reassign
    _parent.childrenIDs.push(metaData.id);

    this.items.push(metaData);
  }

  async unwatch(metaData: MetaData) {
    for (const id of metaData.getIDs()) { // eslint-disable-line no-restricted-syntax
      const idx = this.items.findIndex((item) => {
        return item.id === id;
      });
      if (idx === -1) {
        return;
      }

      this.items.splice(idx, 1);
    }

    if (metaData.parentID == null) {
      return;
    }

    const parent = this.getItemByID(metaData.parentID);
    if (parent == null) {
      return;
    }
    const childIdx = parent.childrenIDs.findIndex((item) => {
      return item === metaData.id;
    });
    if (childIdx === -1) {
      return;
    }

    parent.childrenIDs.splice(childIdx, 1);

    metaData.parentID = null; // eslint-disable-line no-param-reassign
  }

  _getItem(searchPath: string, metaData: MetaData): ?MetaData {
    let ret = null;
    // eslint-disable-next-line no-restricted-syntax
    for (const targetID of metaData.getIDs()) {
      const item = this.getItemByID(targetID);
      if (item == null) {
        continue;
      }

      if (item.isMatchPath(searchPath)) {
        ret = item;
        break;
      }
    }

    return ret;
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

  async addFile(filePath: string, content: string, templateID: ?MetaDataID = null): Promise<[?MetaData, Message.Message]> {
    const normalizedPath = path.normalize(filePath);
    if (!path.isAbsolute(normalizedPath)) {
      return [null, Message.fail(`RepositoryManager.addFile.isAbsolute ${normalizedPath}`)];
    }

    const parentPath = path.dirname(normalizedPath);
    const [_, addDirectoryResult] = await this.addDirectory(parentPath);
    if (Message.isSimilarError(addDirectoryResult)) {
      return [null, Message.wrap(addDirectoryResult)];
    }

    const parentItem = this.getItemByPath(parentPath);
    if (parentItem == null) {
      return [null, Message.fail(`RepositoryManager.addFile.isExist ${parentPath}`)];
    }

    const itemName = path.basename(normalizedPath);
    if (templateID) {
      const template = this.getItemByID(templateID);
      if (template == null) {
        return [
          null,
          Message.fail(`MetaData.addFile template templateID=${templateID}`)
        ];
      }
      const [templateContent] = await template.getContent();
      content = templateContent.replace(/^# (.+)/, `# ${itemName.replace(/(.+?)\..+?$/, '$1')}`); // eslint-disable-line no-param-reassign
    }

    if (content === '' && detectItemType(itemName) === ItemTypeMarkdown) {
      content = `# ${itemName.replace(/(.+?)\..+?$/, '$1')}`; // eslint-disable-line
    }

    const [metaData, message] = await parentItem.addFile(itemName, content);

    const writeMessage = await this.writeMetaDataFile();
    if (Message.isSimilarError(writeMessage)) {
      return [null, writeMessage];
    }

    return [metaData, message];
  }

  async addDirectory(dirPath: string): Promise<[?MetaData, Message.Message]> {
    const normalizedPath = path.normalize(dirPath);
    if (normalizedPath === '/') {
      return [this.rootItem(), Message.success('')];
    }

    if (!path.isAbsolute(normalizedPath)) {
      return [null, Message.fail('RepositoryManager.addDirectory.isAbsolute')];
    }

    const [createdItems, message] = await _mkdir(normalizedPath, this.rootItem());
    if (message.type === Message.MessageTypeFailed) {
      return [null, Message.wrap(message)];
    }

    const ret = createdItems[createdItems.length - 1];

    const writeMessage = await this.writeMetaDataFile();
    if (Message.isSimilarError(writeMessage)) {
      return [null, writeMessage];
    }

    return [ret, Message.wrap(message)];
  }

  // TODO: 無名ファイル実装時には削除ではなく移動になる
  async moveNamelessFile(id: MetaDataID) {
    const idx = this.items.findIndex((item) => {
      return item.id === id;
    });
    if (idx === -1) {
      return;
    }

    const metaData = this.getItemByID(this.items[idx].id);
    if (metaData == null) {
      return;
    }
    const promiseAll = metaData.children().map(async (item) => {
      const r = await item.moveNamelessFile();
      return r;
    });
    await Promise.all(promiseAll);

    this.items.splice(idx, 1);
  }

  getItemByPath(itemPath: string): ?MetaData {
    return this.items.find((item) => {
      return item.path === itemPath;
    });
  }

  toBuffers(): Array<Buffer> {
    return this.items.map((item) => {
      return item.toBuffer();
    });
  }

  toConfig(): RepositoryConfig {
    return {
      absolutePath: this.absolutePath,
      repositoryName: this.name,
    };
  }

  async writeMetaDataFile(): Promise<Message.Message> {
    const conf: RepositoryMetaData = {
      repository: this.toConfig(),
      buffers: this.toBuffers(),
    };
    const json = JSON.stringify(conf, null, 2);

    try {
      fs.writeFileSync(this.configPath(), json);
    } catch (e) {
      return Message.error(`Repository.writeConfig error. name=${this.name}. ${e.message}`);
    }

    return Message.success(`Repository.writeConfig ${this.name}`);
  }

  async loadMetaDataFile(): Promise<Message.Message> {
    let repositoryMetaData:RepositoryMetaData;
    try {
      const json:string = fs.readFileSync(this.configPath(), 'utf8');
      repositoryMetaData = JSON.parse(json, (values) => {
        values.buffer.forEach((item) => {
          item.note = item.note || emptyNote(); // eslint-disable-line no-param-reassign
        });

        return values;
      });
    } catch (e) {
      return Message.error(`Repository.loadMetaDataFile readFile error. name=${this.name}. ${e.message}`);
    }

    if (this.name !== repositoryMetaData.repository.repositoryName) {
      return Message.error(`Repository.loadMetaDataFile name error. name=${this.name} repositoryMetaData.repository.repositoryName=${repositoryMetaData.repository.repositoryName}`); // eslint-disable-line max-len
    }

    if (this.absolutePath !== repositoryMetaData.repository.absolutePath) {
      return Message.error(`Repository.loadMetaDataFile absolutePath error. name=${this.absolutePath} repositoryMetaData.repository.absolutePath=${repositoryMetaData.repository.absolutePath}`); // eslint-disable-line max-len
    }

    this.items = repositoryMetaData.buffers.map((item) => {
      try {
        return new MetaData(item);
      } catch (e) {
        Message.error(`Repository.loadMetaDataFile new MetaData error. id=${item.id} path={item.path}. ${e}`);
        return null;
      }
    }).filter(Boolean);

    return Message.success(`Repository.loadConfig ${this.name}`);
  }

  configPath(): string {
    return path.join(this.absolutePath, configFilename);
  }
}

async function _mkdir(dirPath: string, rootItem: MetaData): Promise<[Array<MetaData>, Message.Message]> {
  const pathItems = path.split(path.normalize(dirPath));
  if (pathItems.length === 0) {
    return [[], Message.fail('RepositoryManager._mkdirP isSimilarFile')];
  }

  const ret:Array<MetaData> = [];
  let currentItem = rootItem;
  for (let i = 0; i < pathItems.length; i += 1) {
    if (pathItems[i] === '') { // /のとき
      ret.push(currentItem);
      continue;
    }

    if (!currentItem.isSimilarDirectory()) {
      return [[], Message.fail('_mkdir check parent directory type error')];
    }

    const name = pathItems[i];
    const child = currentItem.childItem(name);
    if (child != null) {
      ret.push(child);
      currentItem = child;
      continue;
    }

    const [createItem, message] = await currentItem.addDirectory(name);
    if (createItem == null || Message.isSimilarError(message)) {
      return [[], Message.wrap(message)];
    }

    ret.push(createItem);

    currentItem = createItem;
  }

  return [ret, Message.success('')];
}

function createRootBuffer(repositoryName: string, absolutePath: string): Buffer {
  return {
    id: createMetaDataID(),
    name: repositoryName,
    path: '/',
    repositoryName,
    repositoryPath: absolutePath,
    absolutePath,
    itemType: ItemTypeRepository,
    isLoaded: false,
    parentID: null,
    childrenIDs: [],
    body: '',
    note: emptyNote(),
  };
}
//
// function loadBufferItems(buffers: Array<Buffer>): Array<MetaData> {
//   return buffers.map((buf) => {
//     return new MetaData(buf, null);
//   });
// }

export default Repository;
