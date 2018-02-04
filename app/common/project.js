/* eslint no-underscore-dangle: 0 */
// @flow

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import mkdirp from 'mkdirp';
import Markdown from '../main/parser/markdown';
import TableParser from '../main/parser/table';
import watcher from './file_watcher';

const { Config } = require('./bamju_config');

export const ItemTypeProject = 'project';
export const ItemTypeDirectory = 'directory';
export const ItemTypeMarkdown = 'markdown';
export const ItemTypeText = 'text';
export const ItemTypeCSV = 'csv';
export const ItemTypeTSV = 'tsv';
export const ItemTypeUndefined = 'undefined';
export type ItemType = 'project' | 'directory' | 'markdown' | 'text' | 'csv' | 'tsv' | 'undefined';

type Message = {
  success: boolean,
  message: string
};

export type FileItem = {
  name: string,
  path: string,
  projectName: string,
  absolutePath: string,
  itemType: ItemType
};

export type Buffer = {
  body: string
} & FileItem;

export type BufferItem = {
  projectPath: string,
  isLoaded: boolean,
  isOpened: boolean,
  items: Array<BufferItem>
} & FileItem;

export type ParseResult = {
  buffer: Buffer,
  children: Array<ParseResult>
};
export type ParseResults = Array<ParseResult>;

function createBufferRootItem(projectName: string, absolutePath: string): BufferItem {
  return {
    name: projectName,
    path: '/',
    projectName,
    absolutePath,
    itemType: ItemTypeProject,
    projectPath: absolutePath,
    isLoaded: false,
    isOpened: false,
    items: []
  };
}

export class Manager {
  static init(bufferItems: Array<BufferItem>) {
    const initItems = Object.keys(Config.projects).map((name): BufferItem => {
      let buffer = bufferItems.find((bufItem) => {
        return bufItem.projectName === name;
      });

      if (buffer == null) {
        const absolutePath = Config.projects[name];
        buffer = createBufferRootItem(name, absolutePath);
      }

      return buffer;
    });

    _projects = Manager.loadBufferItems(initItems);
  }

  static projects(): ProjectItems {
    return _projects;
  }

  static async loadProjects(): Promise<ProjectItems> {
    await watcher.unregisterAll();

    Object.keys(Config.projects).forEach((name) => {
      if (Manager.find(name) == null) {
        const absolutePath = Config.projects[name];
        _projects.push(new ProjectItem(createBufferRootItem(name, absolutePath)));
      }
    });

    await Promise.all(_projects.map(async (_, i) => {
      if (_projects[i] == null) {
        return Promise.resolve();
      }

      const ret = await _projects[i].load();
      return ret;
    }));

    return _projects;
  }

  static async loadProject(projectName: string): Promise<ProjectItem> {
    const absolutePath:string = Config.projects[projectName];
    if (absolutePath == null) {
      throw new Error(`loadProject error${projectName}`);
    }

    let projectItem = Manager.find(projectName);
    if (projectItem == null) {
      projectItem = new ProjectItem(createBufferRootItem(projectName, absolutePath));
      _projects.push(projectItem);
    }

    const ret = await projectItem.load();

    return ret;
  }

  static async addProject(absolutePath: string) {
    const name:string = path.basename(absolutePath);
    const newProjects:{[string]: string} = Object.assign({}, Config.projects);
    newProjects[name] = absolutePath;

    await Config.update({ projects: newProjects });

    const projectItem = new ProjectItem(createBufferRootItem(name, absolutePath));
    _projects.push(projectItem);
    projectItem.load();
  }

  static async removeProject(absolutePath: string) {
    const name:string = path.basename(absolutePath);
    const newProjects:{[string]: string} = Object.assign({}, Config.projects);
    delete newProjects[name];

    await Config.update({ projects: newProjects });

    const idx = _projects.findIndex((item) => {
      return item.absolutePath === absolutePath;
    });
    if (idx === -1) {
      return;
    }

    _projects.splice(idx);
  }

  static async getBuffer(projectName: string, itemName: string): Promise<ParseResult> {
    const item:?ProjectItem = Manager.detect(projectName, itemName);
    if (item === undefined || item === null) {
      const ret:ParseResult = await Manager.notFoundBuffer(projectName, itemName);
      return ret;
    }

    const ret:ParseResult = await item.toBuffer();
    return ret;
  }

  static find(projectName: string): ?ProjectItem {
    return _projects.find((p: ProjectItem): boolean => { return p.name === projectName; });
  }

  static async notFoundBuffer(projectName: string, itemName: string): Promise<ParseResult> {
    const projectItem:ProjectItem = new ProjectItem({
      absolutePath: '',
      path: itemName,
      projectName,
      itemName,
      projectPath: '',
      name: itemName,
      itemType: ItemTypeUndefined,
      items: [],
      isLoaded: false,
      isOpened: false,
    });
    const md: string =
`
# not found

${projectName}:${itemName}
`;

    const ret:ParseResult = await Markdown.parse(projectItem, md);

    return ret;
  }

  static detect(projectName: string, itemName: string): ?ProjectItem {
    const rootItem = this.find(projectName);
    if (rootItem === undefined || rootItem === null) {
      return null;
    }

    return rootItem.detect(itemName);
  }

  static async createFile(projectName: string, itemName: string): Promise<Message> {
    const project = Manager.find(projectName);
    if (project == null) {
      return {
        success: false,
        message: `repository '${projectName}' not found`
      };
    }

    if (itemName === '' || itemName === '/') {
      return {
        success: false,
        message: `invalid filename ${itemName}`
      };
    }

    const absolutePath = path.join(project.absolutePath, itemName);
    if (fs.existsSync(absolutePath)) {
      return {
        success: false,
        message: `already exist ${absolutePath}`
      };
    }

    const parentDir = path.dirname(absolutePath);
    if (!fs.existsSync(parentDir)) {
      if (Config.config.mkdirP) {
        mkdirp.sync(parentDir, 0o755);
      } else {
        return {
          success: false,
          message: `parent directory doesen't exist. '${parentDir}'`
        };
      }
    }

    const fileInfo = path.parse(itemName);
    let content:string;
    switch (fileInfo.ext) {
    case '.md': {
      content = `# ${fileInfo.name}`;
      break;
    }
    case '.txt': {
      content = fileInfo.name;
      break;
    }
    case '.csv': {
      content = '';
      break;
    }
    case '.tsv': {
      content = '';
      break;
    }
    default:
      return {
        success: false,
        message: `extension error: '${fileInfo.ext}'`
      };
    }

    return promisify(fs.writeFile)(absolutePath, content, { mode: 0o644 }).then(async () => {
      const itemPath = path.join('/', absolutePath.substring(project.projectPath.length));
      const parentPath = path.dirname(itemPath);
      const parentItem = project.detect(parentPath);
      if (parentItem) {
        await parentItem.open();
      }

      return { success: true, message: '' };
    }).catch((err) => {
      return {
        success: false,
        message: `write file error: '${err.message}'`
      };
    });
  }

  static async saveBuffer(buffer: Buffer): Promise<Message> {
    const ret = await promisify(fs.writeFile)(buffer.absolutePath, buffer.body).then(async () => {
      return { success: true, message: 'saved' };
    }).catch((err) => {
      return {
        success: false,
        message: `write file error: '${err.message}'`
      };
    });

    return ret;
  }

  static getBufferItems(): Array<BufferItem> {
    return _projects.map((item) => {
      return item.toBufferItem();
    });
  }

  static loadBufferItems(items: Array<BufferItem>): ProjectItems {
    _projects = items.map((item): ProjectItem => {
      return new ProjectItem(item);
    });

    return _projects;
  }

  static async watch(projectName: string, absolutePath: string, callback: WatchCallback): Promise<void> {
    // bufferとTreeViewの更新

    const item:?ProjectItem = Manager.detect(projectName, absolutePath);
    if (item == null) {
      return;
    }

    await watcher.register('change', item, callback);
  }

  static async unwatch(): Promise<void> {
    await watcher.unregisterAll();
  }
}

export type WatchCallback = () => void;

let _projects: Array<ProjectItem> = [];

export class ProjectItem {
  name: string;
  projectName: string;
  projectPath: string;
  path: string;
  absolutePath: string;
  itemType: ItemType;
  items: ProjectItems;
  isLoaded: boolean;
  isOpened: boolean;

  constructor(bufItem: BufferItem) {
    this.projectName = bufItem.projectName;
    this.projectPath = bufItem.projectPath;
    this.name = bufItem.name;
    this.path = bufItem.path;
    this.absolutePath = path.normalize(bufItem.absolutePath);
    this.itemType = bufItem.itemType;
    this.items = bufItem.items.map((item) => {
      return new ProjectItem(item);
    });
    this.isLoaded = bufItem.isLoaded;
    this.isOpened = bufItem.isOpened;
  }

  async load(lazyLoad: boolean = true): Promise<boolean> {
    if (this.itemType !== ItemTypeDirectory && this.itemType !== ItemTypeProject) {
      this.isLoaded = true;
      return true;
    }

    this.isLoaded = false;

    try {
      this.items = await this.loadDirectory(lazyLoad);
    } catch (e) {
      throw e;
    }

    this.isLoaded = true;

    return true;
  }

  async loadDirectory(lazyLoad: boolean = true): Promise<ProjectItems> {
    let files: Array<string>;
    const { projectName, projectPath } = this;
    try {
      files = await promisify(fs.readdir)(this.absolutePath);
    } catch (e) {
      return [new ProjectItem({
        name: 'directory not found',
        projectName,
        projectPath,
        path: this.path,
        absolutePath: this.absolutePath,
        itemType: ItemTypeUndefined,
        items: [],
        isLoaded: true,
        isOpened: false,
      })];
    }

    const promiseAll = files.map(async (filename: string): Promise<ProjectItem> => {
      const absolutePath = path.join(this.absolutePath, filename);
      const itemType:ItemType = detectItemTypeByAbsPath(absolutePath);
      const itemPath = path.join('/', absolutePath.substring(this.projectPath.length));

      let projectItem = this.items.find((item) => {
        return item.name === filename;
      });
      if (projectItem == null) {
        projectItem = new ProjectItem({
          name: filename,
          projectName,
          projectPath,
          path: itemPath,
          absolutePath,
          itemType,
          items: [],
          isLoaded: false,
          isOpened: false,
        });
      }

      projectItem.isLoaded = false;
      projectItem.items = [];

      if (lazyLoad) {
        projectItem.load(lazyLoad);
      } else {
        await projectItem.load(lazyLoad);
      }

      return projectItem;
    });

    const ret = await Promise.all(promiseAll);

    return ret;
  }

  async open(lazyLoad: boolean = true): Promise<boolean> {
    await this.load(lazyLoad);

    this.isOpened = true;
    const p = this.parent();
    if (p) {
      await p.open();
    }

    return true;
  }

  async close() {
    this.isOpened = false;
    this.items.forEach((_, i) => {
      this.items[i].isOpened = false;
      this.items[i].close();
    });
  }

  detect(name: string): ?ProjectItem {
    if (name.match(/^\//)) {
      if (this.path === name) {
        return this;
      }
    }

    if (this.name === name) {
      return this;
    }

    if (this.name === `${name}.md`) {
      return this;
    }

    if (this.name === `${name}.txt`) {
      return this;
    }

    if (this.name === `${name}.csv`) {
      return this;
    }

    if (this.name === `${name}.tsv`) {
      return this;
    }

    let ret:?ProjectItem;
    this.items.forEach((item: ProjectItem) => {
      const i:?ProjectItem = item.detect(name);

      if (i !== undefined && i !== null) {
        ret = i;
      }
    });


    return ret;
  }

  async content(): Promise<string> {
    let ret:string;
    if (this.itemType === ItemTypeDirectory) {
      const indexItem:?ProjectItem = this.items.find((item: ProjectItem): boolean => {
        const name:string = path.basename(item.name, path.extname(item.name));

        return name === 'index';
      });

      if (indexItem) {
        ret = await readFile(indexItem.absolutePath);
      } else {
        ret = await readDirectory(this);
      }
    } else if (this.itemType === ItemTypeUndefined) {
      ret = 'not found';
    } else {
      ret = await readFile(this.absolutePath);
    }

    return ret;
  }

  async toBuffer(): Promise<ParseResult> {
    let ret:ParseResult;
    if (this.itemType === ItemTypeDirectory || this.itemType === ItemTypeProject) {
      ret = await this.openDirectory();
    } else if (this.itemType === ItemTypeUndefined) {
      ret = {
        buffer: {
          name: '',
          path: '',
          projectName: '',
          absolutePath: '',
          itemType: ItemTypeUndefined,
          body: 'not found',
        },
        children: []
      };
    } else {
      ret = await this.openFile();
    }

    return ret;
  }

  async toRawBuffer(): Promise<Buffer> {
    // NOTE: 雑
    const ret:Buffer = Object.assign({}, this.toBufferItem(), { body: '' });

    if (this.itemType !== ItemTypeMarkdown && this.itemType !== ItemTypeText) {
      ret.body = '';
      ret.itemType = ItemTypeUndefined;
      return ret;
    }

    ret.body = await readFile(this.absolutePath);

    return ret;
  }

  async openDirectory(): Promise<ParseResult> {
    let ret:ParseResult;

    const n = Object.assign({}, this.toBufferItem(), {
      path: path.join(this.path, 'index.md'),
      absolutePath: path.join(this.absolutePath, 'index.md')
    });
    const directoryIndexItem:ProjectItem = new ProjectItem(n);

    try {
      await promisify(fs.stat)(directoryIndexItem.absolutePath);
      ret = await openFile(directoryIndexItem);
    } catch (e) {
      ret = await openDirectory(this);
    }

    return ret;
  }

  async openFile(): Promise<ParseResult> {
    const ret:ParseResult = await openFile(this);

    return ret;
  }

  parent(): ?ProjectItem {
    if (this.path === '/') {
      return null;
    }

    return Manager.detect(this.projectName, path.dirname(this.path));
  }

  toBufferItem(): BufferItem {
    const items = this.items.map((item) => {
      return item.toBufferItem();
    });

    return {
      name: this.name,
      projectName: this.projectName,
      projectPath: this.projectPath,
      path: this.path,
      absolutePath: this.absolutePath,
      itemType: this.itemType,
      items,
      isLoaded: this.isLoaded,
      isOpened: this.isOpened
    };
  }

  internalPath(): string {
    return internalPath(this.projectName, this.path);
  }
}
export type ProjectItems = Array<ProjectItem>;

async function openDirectory(item: ProjectItem): Promise<ParseResult> {
  const md:string = await readDirectory(item);
  const ret:ParseResult = await Markdown.parse(item, md);

  return ret;
}

async function openFile(item: ProjectItem): Promise<ParseResult> {
  const text:string = await readFile(item.absolutePath);

  let ret:ParseResult;
  if (item.itemType === ItemTypeMarkdown || item.itemType === ItemTypeText) {
    ret = await Markdown.parse(item, text);
  } else if (item.itemType === ItemTypeCSV) {
    ret = await TableParser.parse(item, text, [], { delimiter: ',' });
  } else if (item.itemType === ItemTypeTSV) {
    ret = await TableParser.parse(item, text, [], { delimiter: '\t' });
  } else {
    ret = await Markdown.parse(item, 'error');
  }

  return ret;
}


async function readFile(absolutePath: string): Promise<string> {
  try {
    const text:string = (await promisify(fs.readFile)(absolutePath)).toString('UTF-8');
    return text;
  } catch (e) {
    console.log('Project.readFile err', e);
    return '';
  }
}

async function readDirectory(item: ProjectItem): Promise<string> {
  try {
    const files:Array<string> = await promisify(fs.readdir)(item.absolutePath);
    const items:Array<string> = files.map((filename) => {
      const p = path.join(item.path, filename);
      const text = path.basename(filename, path.extname(filename));
      const absPath = path.join(item.absolutePath, filename);

      if (detectItemTypeByAbsPath(absPath) === ItemTypeUndefined) {
        return null;
      }

      return `- [[${item.projectName}:${p}]]{${text}}`;
    }).filter(Boolean); // nullを消したい

    const ret:string = `
# ${item.projectName}:${item.path}

${items.join('\n')}
  `;

    return ret;
  } catch (e) {
    return '';
  }
}

export function detectItemTypeByAbsPath(p: string): ItemType {
  const stat:fs.Stats = fs.statSync(p);

  if (stat.isDirectory()) {
    return ItemTypeDirectory;
  }

  if (p.match(/\.md$/)) {
    return ItemTypeMarkdown;
  }

  if (p.match(/\.txt$/)) {
    return ItemTypeText;
  }

  if (p.match(/\.csv$/)) {
    return ItemTypeCSV;
  }
  if (p.match(/\.tsv/)) {
    return ItemTypeTSV;
  }

  return ItemTypeUndefined;
}

export function detectItemType(projectName: string, itemName: string): ItemType {
  const projectPath:?string = Config.projects[projectName];
  if (projectPath === null || projectPath === undefined) {
    return ItemTypeUndefined;
  }

  const abs:string = path.join(projectPath, itemName);

  return detectItemTypeByAbsPath(abs);
}

export function resolveInternalPath(p: string): {projectName: ?string, path: string} {
  const split = p.split(':', 2);
  let projectName: ?string;
  let retPath: string;
  if (split.length === 2) {
    [projectName, retPath] = split;
  } else {
    [retPath] = split;
  }

  retPath = path.join('/', retPath);

  return {
    projectName,
    path: retPath
  };
}
export function internalPath(projectName: string, itemPath: string): string {
  return `${projectName}:${itemPath}`;
}
