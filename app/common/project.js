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
  absolutePath: string,
  itemType: ItemType,
  body: string
};

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
      const idx:number = _projects.findIndex((item: Project): boolean => item.name === projectName);

      _projects[idx] = ret;
    }


    return ret;
  }

  static async getBuffer(projectName: string, itemName: string): Promise<Buffer> {
    const p:?Project = this.find(projectName);
    if (p === undefined || p === null) {
      const ret:Buffer = await Manager.notFoundBuffer(projectName, itemName);
      return ret;
    }

    const item:?ProjectItem = p.detect(itemName);
    if (item === undefined || item === null) {
      const ret:Buffer = await Manager.notFoundBuffer(projectName, itemName);
      return ret;
    }

    const ret:Buffer = await item.toBuffer();

    return ret;
  }

  static find(projectName: string): ?Project {
    return _projects.find((p: Project): boolean => p.name === projectName);
  }

  static async notFoundBuffer(projectName: string, itemName: string): Promise<Buffer> {
    const html:string = await Markdown.parse(projectName, `# not found

        ${projectName}:${itemName}
      `);

    return {
      name: 'not found',
      path: '',
      absolutePath: '',
      itemType: 'undefined',
      body: html
    };
  }
}

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

    return item !== null;
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

  async openFile(p: string): Promise<?Buffer> {
    const item:?ProjectItem = this.detect(p);
    if (item === undefined || item === null) {
      return undefined;
    }

    const ret:Buffer = await item.toBuffer();
    return ret;
  }
}
export type Projects = Array<Project>;

let _projects:Projects = [];

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

    let ret:?ProjectItem;
    this.items.forEach((item: ProjectItem) => {
      const i:?ProjectItem = item.detect(name);

      if (i !== undefined && i !== null) {
        ret = i;
      }
    });


    return ret;
  }

  async toBuffer(): Promise<Buffer> {
    let html:string = '';
    if (this.itemType === 'directory') {
      html = await this.openDirectory();
    } else {
      html = await this.openFile();
    }

    const ret:Buffer = {
      name: this.name,
      path: this.path,
      absolutePath: this.absolutePath,
      itemType: this.itemType,
      body: html
    };

    return ret;
  }

  async openDirectory(): Promise<string> {
    let ret:string = '';
    const indexPath:string = path.join(this.absolutePath, 'index.md');
    try {
      await promisify(fs.stat)(indexPath);
      ret = await openFile(this.projectName, indexPath);
    } catch (e) {
      ret = await openDirectory(this.projectName, this.absolutePath);
    }

    return ret;
  }

  async openFile(): Promise<string> {
    const ret:string = await openFile(this.projectName, this.absolutePath);

    return ret;
  }
}
export type ProjectItems = Array<ProjectItem>;

async function openDirectory(projectName: string, p: string): Promise<string> {
  const files:Array<string> = await promisify(fs.readdir)(p);
  const items:Array<string> = files.map((filename: string) => `- [[${filename}]]`);

  const html:string = `# ${p}

  ${items.join('\n')}
  `;

  const ret:string = await Markdown.parse(projectName, html);

  return ret;
}

async function openFile(projectName: string, p: string): Promise<string> {
  const ret:string = await Markdown.parseByAbsolutePath(projectName, p);

  return ret;
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
