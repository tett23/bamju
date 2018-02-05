// @flow

import path from 'path';

type ID = string;

export type Buffer = {
  id: ID,
  name: string,
  path: string,
  projectName: string,
  absolutePath: string,
  itemType: ItemType,
  parent: ?Buffer,
  children: Array<Buffer>,
  isLoaded: boolean,
  isOpened: boolean
};

type RepositoryConfig = Array<{
  repositoryName: string,
  absolutePath: string
}>;

export const ItemTypeRepository = 'repository';
export const ItemTypeDirectory = 'directory';
export const ItemTypeMarkdown = 'markdown';
export const ItemTypeText = 'text';
export const ItemTypeCSV = 'csv';
export const ItemTypeTSV = 'tsv';
export const ItemTypeHTML = 'html';
export const ItemTypeUndefined = 'undefined';
export type ItemType = 'repository' | 'directory' | 'markdown' | 'text' | 'csv' | 'tsv' | 'html' | 'undefined';

let _repositories:Array<MetaData> = [];

export class RepositoryManager {
  static async init(buffers: Array<Buffer>, _: RepositoryConfig): Promise<Array<MetaData>> {
    const ret = buffers.map((buffer) => {
      return new MetaData(buffer);
    });

    _repositories = ret;

    return ret;
  }
}


export class FileItem {

}

export class MetaData {
  id: ID;
  name: string;
  path: string;
  projectName: string;
  absolutePath: string;
  itemType: ItemType;
  parent: ?Buffer;
  children: Array<Buffer>;
  isLoaded: boolean;
  isOpened: boolean;

  constructor(buffer: Buffer) {
    this.id = buffer.id;
    this.name = buffer.name;
    this.path = buffer.path;
    this.projectName = buffer.projectName;
    this.absolutePath = buffer.absolutePath;
    this.itemType = buffer.itemType;
    if (buffer.parent != null) {
      this.parent = new MetaData(buffer.parent);
    }
    this.children = buffer.children.map((c) => {
      return new MetaData(c);
    });
    this.isLoaded = buffer.isLoaded;
    this.isOpened = buffer.isOpened;
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

export default RepositoryManager;
