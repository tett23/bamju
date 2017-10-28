// @flow

import { ipcMain } from 'electron';
import * as Project from '../common/project';
import { getBamjuConfig } from '../common/bamju_config';

const path = require('path');
const fs = require('fs');
const marked = require('marked');

ipcMain.on('open-main-page', (event) => {
  const buf = openFile('bamju-specifications', 'index.md');

  event.sender.send('open-page', buf);
  event.returnValue = buf;
});

ipcMain.on('open-page', (event, args) => {
  const buf = openFile(args.projectName, args.itemName);

  event.sender.send('open-page', buf);
  event.returnValue = buf;
});

ipcMain.on('refresh-tree-view', (event, projectName: ?string) => {
  let tree:Project.Projects = [];
  if (projectName != null) {
    tree.push(loadProject(projectName));
  } else {
    tree = loadProjects();
  }

  event.sender.send('refresh-tree-view', tree);
  event.returnValue = tree;
});

const loadProjects = (): Project.Projects => {
  const ret:Project.Projects = [];

  console.log('loadProjects', getBamjuConfig().projects);
  Object.keys(getBamjuConfig().projects).forEach((projectName: string) => {
    ret.push(loadProject(projectName));
  });
  console.log('loadProjects ret', ret);

  return ret;
};

const loadProject = (projectName: string): Project.Project => {
  const projectPath:string = getBamjuConfig().projects[projectName];
  if (projectPath === undefined) {
    throw new Error(`loadProject error${projectName}`);
  }

  const basePath:string = path.dirname(projectPath);

  const ret:Project.Project = {
    name: projectName,
    path: '/',
    items: loadDirectory(projectPath, basePath)
  };

  return ret;
};

const loadDirectory = (projectPath: string, basePath: string): Project.ProjectItems => {
  const files = fs.readdirSync(projectPath);
  const ret:Project.ProjectItems = [];
  files.forEach((filename: string) => {
    const p:string = path.join(projectPath, filename);
    const itemType:Project.ItemType = Project.detectItemTypeByAbsPath(p);

    let items:Project.ProjectItems = [];
    if (itemType === Project.ItemTypeDirectory) {
      items = loadDirectory(p, basePath);
    }

    ret.push({
      name: filename,
      path: p.replace(basePath, ''),
      itemType,
      items
    });
  });

  return ret;
};

const openFile = (projectName: string, itemName: string): Project.buffer => {
  const projectPath:string = getBamjuConfig().projects[projectName];
  const abs:string = path.join(projectPath, itemName);
  const stat:fs.Stat = fs.statSync(abs);
  if (stat.isDirectory()) {
    return openDirectory(projectName, itemName);
  }

  const buf:Buffer = fs.readFileSync(abs);
  const body:string = buf.toString('UTF-8');
  const md:string = marked(body, {
    gfm: true,
    tables: true,
    breaks: true
  });

  const itemType:Project.ItemType = Project.detectItemType(projectName, itemName);

  const ret:Project.buffer = {
    name: itemName,
    path: path.join(projectName, itemName),
    itemType,
    body: md
  };

  return ret;
};

const openDirectory = (projectName: string, itemName: string): Project.buffer => {
  const projectPath:string = getBamjuConfig().projects[projectName];
  const abs:string = path.join(projectPath, itemName);
  const files = fs.readdirSync(abs);

  let body:string = '';
  files.forEach((file: string) => {
    body += file;
  });

  const ret:Project.buffer = {
    name: itemName,
    path: path.join(projectName, itemName),
    itemType: Project.ItemTypeDirectory,
    body
  };

  return ret;
};

// あとで拡張子どうこうする
const normalizeName = (itemName: string): string => {
  if (itemName.match(/\.md$/)) {
    return itemName;
  }

  return `${itemName}.md`;
};
