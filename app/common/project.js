// @flow

import Config from '../common/bamju_config';

const fs = require('fs');
const path = require('path');

export type Project = {
  name: string,
  path: string,
  absolutePath: string,
  itemType: ItemType,
  items: ProjectItems
};
export type Projects = Array<Project>;

export const ItemTypeProject:string = 'project';
export const ItemTypeDirectory = 'directory';
export const ItemTypeMarkdown = 'markdown';
export const ItemTypeText = 'text';
export const ItemTypeUndefined = 'undefined';
export type ItemType = 'project' | 'directory' | 'markdown' | 'text' | 'undefined';

export type ProjectItem = {
  name: string,
  path: string,
  absolutePath: string,
  itemType: ItemType,
  items: ProjectItems
};
export type ProjectItems = Array<ProjectItem>;

export type Buffer = {
  name: string,
  path: string,
  absolutePath: string,
  itemType: ItemType,
  body: string
};

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
