/* eslint no-underscore-dangle: 0 */
// @flow

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import Config from './bamju_config';
import Markdown from '../main/parser/markdown';

export const ItemTypeProject:string = 'project';
export const ItemTypeDirectory = 'directory';
export const ItemTypeMarkdown = 'markdown';
export const ItemTypeText = 'text';
export const ItemTypeUndefined = 'undefined';
export type ItemType = 'project' | 'directory' | 'markdown' | 'text' | 'undefined';

export type Buffer = {
  name: string,
  path: string,
  projectName: string,
  absolutePath: string,
  itemType: ItemType,
  body: string
};

export type ParseResult = {
  buffer: Buffer,
  children: Array<ParseResult>
};
export type ParseResults = Array<ParseResult>;

export class Manager {
  static async init() {
    _projects = await Manager.loadProjects();
  }

  static projects(): Projects {
    return _projects;
  }

  static async loadProjects(): Promise<Projects> {
    _projects = [];

    const projectNames:Array<string> = Object.keys(Config.projects);
    const ret:Projects = [];
    await Promise.all(projectNames.map(async (projectName: string) => {
      const p:Project = await Manager.loadProject(projectName);
      ret.push(p);
    }));

    console.log('Manager.loadProjects', ret);
    _projects = ret;

    return ret;
  }

  static async loadProject(projectName: string): Promise<Project> {
    const projectPath:string = Config.projects[projectName];
    if (projectPath === undefined) {
      throw new Error(`loadProject error${projectName}`);
    }

    const ret:Project = new Project(projectName);
    await ret.load();

    if (Manager.find(projectName) === undefined) {
      _projects.push(ret);
    } else {
      const idx:number = _projects.findIndex((item: Project): boolean => { return item.name === projectName; });

      _projects[idx] = ret;
    }


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
    const p:?Project = this.find(projectName);
    if (p === undefined || p === null) {
      return undefined;
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

  static find(projectName: string): ?Project {
    return _projects.find((p: Project): boolean => { return p.name === projectName; });
  }

  static async notFoundBuffer(projectName: string, itemName: string): Promise<ParseResult> {
    const projectItem:ProjectItem = new ProjectItem({
      absolutePath: '',
      path: '',
      projectName,
      itemName,
      projectPath: '',
      name: 'not found',
      itemType: ItemTypeUndefined
    });
    const md: string =
`
# not found

${projectName}:${itemName}
`;

    const ret:ParseResult = await Markdown.parse(projectItem, md);

    return ret;
  }

  static watch(projectName: string, absolutePath: string, callback: WatchCallback) {
    watchFiles.push({ projectName, absolutePath });

    // bufferとTreeViewの更新
    fs.unwatchFile(absolutePath);
    fs.watchFile(absolutePath, {}, callback);
  }

  static unwatch() {
    watchFiles.forEach(({ absolutePath }) => {
      fs.unwatchFile(absolutePath);
    });

    watchFiles = [];
  }
}

export type WatchCallback = () => void;

let watchFiles:Array<{projectName: string, absolutePath: string}> = [];

export class Project {
  name: string;
  path: string;
  absolutePath: string;
  itemType: ItemType;
  items: ProjectItems;
  isLoaded: boolean;

  constructor(projectName: string) {
    const p:?string = Config.projects[projectName];
    if (p === null || p === undefined) {
      throw Error(`project not found ${projectName}`);
    }

    this.name = projectName;
    this.path = '/';
    this.absolutePath = p;
    this.itemType = 'project';
    this.items = [];
    this.isLoaded = false;
  }

  async load(): Promise<boolean> {
    try {
      this.items = await this.loadDirectory();
    } catch (e) {
      throw e;
    }

    this.isLoaded = true;

    return true;
  }

  async loadDirectory(): Promise<ProjectItems> {
    const rootItem:ProjectItem = new ProjectItem({
      name: this.name,
      projectName: this.name,
      projectPath: this.absolutePath,
      path: '/',
      absolutePath: this.absolutePath,
      itemType: 'directory',
    });
    await rootItem.load();
    this.items = [rootItem];

    return this.items;
  }

  isExistPage(page: string): boolean {
    const item:?ProjectItem = this.detect(page);

    return !!item;
  }

  detect(name: string): ?ProjectItem {
    let ret:?ProjectItem;
    this.items.forEach((item: ProjectItem) => {
      const i:?ProjectItem = item.detect(name);

      if (i !== undefined && i !== null) {
        ret = i;
      }
    });

    return ret;
  }

  async openFile(p: string): Promise<?ParseResult> {
    const item:?ProjectItem = this.detect(p);
    if (item === undefined || item === null) {
      return undefined;
    }

    const ret:ParseResult = await item.toBuffer();
    return ret;
  }
}
export type Projects = Array<Project>;

let _projects: Projects = [];

export class ProjectItem {
  name: string;
  projectName: string;
  projectPath: string;
  path: string;
  absolutePath: string;
  itemType: ItemType;
  items: ProjectItems;
  isLoaded: boolean;

  constructor({
    name, projectName, projectPath, path: p, absolutePath, itemType
  }: {
    name: string, projectName: string, projectPath: string, path: string, absolutePath: string, itemType: ItemType}) {
    this.projectName = projectName;
    this.projectPath = projectPath;
    this.name = name;
    this.path = p;
    this.absolutePath = absolutePath;
    this.itemType = itemType;
    this.items = [];
    this.isLoaded = false;
  }

  async load(): Promise<boolean> {
    if (this.itemType !== 'directory') {
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

  async loadDirectory(basePath: string): Promise<ProjectItems> {
    // console.log('ProjectItem.loadDirectory this', this);
    // console.log('ProjectItem.loadDirectory basePath', basePath);
    const { projectName, projectPath } = this;
    const files:Array<string> = await promisify(fs.readdir)(this.absolutePath);

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
      });
      await item.load();
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
      ret = await readDirectory(this);
    } else if (this.itemType === ItemTypeUndefined) {
      ret = 'not found';
    } else {
      ret = await readFile(this.absolutePath);
    }

    return ret;
  }

  async toBuffer(): Promise<ParseResult> {
    let ret:ParseResult;
    if (this.itemType === ItemTypeDirectory) {
      ret = await this.openDirectory();
    } else if (this.itemType === ItemTypeUndefined) {
      ret = {
        buffer: {
          name: '',
          path: '',
          projectName: '',
          absolutePath: '',
          itemType: ItemTypeUndefined,
          body: 'not found'
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

    const n = Object.assign({}, this, {
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
}
export type ProjectItems = Array<ProjectItem>;

async function openDirectory(item: ProjectItem): Promise<ParseResult> {
  const md:string = await readDirectory(item);
  const ret:ParseResult = await Markdown.parse(item, md);

  return ret;
}

async function openFile(item: ProjectItem): Promise<ParseResult> {
  const md:string = await readFile(item.absolutePath);
  const ret:ParseResult = await Markdown.parse(item, md);

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
    const items:Array<string> = files.map((filename: string) => {
      const p:string = path.join(item.path, filename);
      const text:string = path.basename(filename, path.extname(filename));

      return `- [[${item.projectName}:${p}]]{${text}}`;
    });

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
