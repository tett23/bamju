/* eslint no-underscore-dangle: 0 */
// @flow

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
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

export class Manager {
  static async init() {
    console.log('Project.Manager.init _projects', _projects);
    await Manager.loadProjects();
  }

  static projects(): ProjectItems {
    return _projects;
  }

  static async loadProjects(watchCallback: Function = () => {}): Promise<ProjectItems> {
    _projects.splice(0);

    await watcher.unregisterAll();

    const projectNames:Array<string> = Object.keys(Config.projects);
    await Promise.all(projectNames.map(async (projectName: string): Promise<ProjectItem> => {
      const ret:ProjectItem = await Manager.loadProject(projectName, watchCallback);

      return ret;
    }));

    return _projects;
  }

  static async loadProject(projectName: string, watchCallback: Function = () => {}): Promise<ProjectItem> {
    const projectPath:string = Config.projects[projectName];
    if (projectPath === undefined) {
      throw new Error(`loadProject error${projectName}`);
    }

    const ret:ProjectItem = new ProjectItem({
      name: projectName,
      projectName,
      projectPath,
      path: '/',
      absolutePath: projectPath,
      itemType: ItemTypeProject,
      items: [],
      isLoaded: false,
      isOpened: false,
    });
    await ret.load();

    if (Manager.find(projectName) === undefined) {
      _projects.push(ret);
    } else {
      const idx:number = _projects.findIndex((item: ProjectItem): boolean => { return item.name === projectName; });

      _projects[idx] = ret;
    }

    // const callback = () => {
    //   Manager.loadProject(ret.name);
    //   watchCallback();
    // };
    // const item:ProjectItem = ret.items[0];
    // if (item !== null && item !== undefined) {
    //   watcher.register('add', item, callback, { recursive: false });
    //   watcher.register('unlink', item, callback, { recursive: false });
    //   watcher.register('addDir', item, callback, { recursive: false });
    //   watcher.register('unlinkDir', item, callback, { recursive: false });
    // }

    return ret;
  }

  static async addProject(absolutePath: string) {
    const name:string = path.basename(absolutePath);
    const newProjects:{[string]: string} = Object.assign({}, Config.projects);
    newProjects[name] = absolutePath;

    await Config.update({ projects: newProjects });

    await this.loadProjects();
  }

  static async removeProject(absolutePath: string) {
    const name:string = path.basename(absolutePath);
    const newProjects:{[string]: string} = Object.assign({}, Config.projects);
    delete newProjects[name];

    await Config.update({ projects: newProjects });

    await this.loadProjects();
  }

  static getProjectItem(projectName: string, itemName: string): ?ProjectItem {
    const p:?ProjectItem = this.find(projectName);
    if (p === undefined || p === null) {
      return null;
    }

    const ret:?ProjectItem = p.detect(itemName);

    return ret;
  }

  static async getBuffer(projectName: string, itemName: string): Promise<ParseResult> {
    const item:?ProjectItem = Manager.getProjectItem(projectName, itemName);
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
      path: '',
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
    const projects:ProjectItems = Manager.projects();
    const project:?ProjectItem = projects.find((p: ProjectItem): boolean => {
      return p.name === projectName;
    });

    if (project === null || project === undefined) {
      return null;
    }

    return project.detect(itemName);
  }

  static async createFile(projectName: string, itemName: string) {
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

    try {
      promisify(fs.writeFile)(absolutePath, content);
    } catch (e) {
      return {
        success: false,
        message: e.message
      };
    }

    return { success: true, message: '' };
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

const _projects: Array<ProjectItem> = [];
console.log('require projects _projects', _projects);

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

  async load(): Promise<boolean> {
    if (this.itemType !== ItemTypeDirectory && this.itemType !== ItemTypeProject) {
      this.isLoaded = true;
      return true;
    }

    try {
      const basePath:string = path.join('/', this.absolutePath.replace(this.projectPath, ''));

      this.items = await this.loadDirectory(basePath);
    } catch (e) {
      throw e;
    }

    this.isLoaded = true;

    return true;
  }

  async loadDirectory(basePath: string, lazyLoad: boolean = true): Promise<ProjectItems> {
    // console.log('ProjectItem.loadDirectory this', this);
    // console.log('ProjectItem.loadDirectory basePath', basePath);
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

    const ret:ProjectItems = [];
    await Promise.all(files.map(async (filename: string) => {
      // console.log('ProjectItem.loadDirectory filename', filename);
      const abs:string = path.join(this.projectPath, basePath, filename);
      // console.log('ProjectItem.loadDirectory abs', abs);
      const itemType:ItemType = detectItemTypeByAbsPath(abs);

      const item:ProjectItem = new ProjectItem({
        name: filename,
        projectName,
        projectPath,
        path: path.join('/', basePath, filename),
        absolutePath: abs,
        itemType,
        items: [],
        isLoaded: false,
        isOpened: false,
      });

      if (lazyLoad) {
        item.load();
      } else {
        await item.load();
      }

      ret.push(item);
    }));

    return ret;
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

  async openDirectory(): Promise<ParseResult> {
    let ret:ParseResult;

    const n = Object.assign(this.toBufferItem(), {
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
