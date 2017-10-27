// @flow

import { getBamjuConfig } from '../common/bamju_config';

const fs = require('fs');
const path = require('path');

export type project = {
  name: string,
  path: string,
  items: projectItems
};
export type projects = Array<project>;

export const ItemTypeProject = 'project';
export const ItemTypeDirectory = 'directory';
export const ItemTypeMarkdown = 'markdown';
export const ItemTypeText = 'text';
export const ItemTypeUndefined = 'undefined';
export type ItemType = ItemTypeProject | ItemTypeDirectory | ItemTypeMarkdown | ItemTypeText | ItemTypeUndefined;

export type projectItem = {
  name: string,
  path: string,
  itemType: ItemType,
  items: projectItems
};
export type projectItems = Array<projectItem>;

export type buffer = {
  name: string,
  path: string,
  itemType: ItemType,
  body: string
};

export function detectItemTypeByAbsPath(p: string): ItemType {
  const stat:fs.Stat = fs.statSync(p);

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
  const projectPath:?string = getBamjuConfig().projects[projectName];
  if (projectPath === undefined) {
    return ItemTypeUndefined;
  }

  const abs:string = path.join(projectPath, itemName);

  return detectItemTypeByAbsPath(abs);
}
