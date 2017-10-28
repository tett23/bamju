// @flow

import { ipcMain } from 'electron';
import util from 'util';
import * as Project from '../common/project';
import { getBamjuConfig } from '../common/bamju_config';

const path = require('path');
const fs = require('fs');
const marked = require('marked');

ipcMain.on('open-main-page', async (e) => {
  const buf:Project.Buffer = await openFile('bamju-specifications', 'index.md');

  e.sender.send('open-page', buf);
  e.returnValue = buf;
});

ipcMain.on('open-page', async (e, args) => {
  const buf:Project.Buffer = await openFile(args.projectName, args.itemName);

  e.sender.send('open-page', buf);
  e.returnValue = buf;
});

ipcMain.on('refresh-tree-view', async (e, projectName: ?string) => {
  let tree:Project.Projects = [];
  if (projectName != null) {
    tree.push(await loadProject(projectName));
  } else {
    tree = await loadProjects();
  }
  console.log('refresh-tree-view ret', tree);

  e.sender.send('refresh-tree-view', tree);
  e.returnValue = tree;
});

const loadProjects = async (): Promise<Project.Projects> => {
  const ret:Project.Projects = [];

  console.log('loadProjects', getBamjuConfig().projects);
  const projectNames:Array<string> = Object.keys(getBamjuConfig().projects);
  await Promise.all(projectNames.map(async (projectName: string) => {
    ret.push(await loadProject(projectName));
  }));
  console.log('loadProjects ret', ret);

  return ret;
};

const loadProject = async (projectName: string): Promise<Project.Project> => {
  const projectPath:string = getBamjuConfig().projects[projectName];
  if (projectPath === undefined) {
    throw new Error(`loadProject error${projectName}`);
  }

  const basePath:string = path.dirname(projectPath);

  const ret:Project.Project = {
    name: projectName,
    path: '/',
    items: await loadDirectory(projectPath, basePath)
  };
  console.log('loadProject ret', ret);

  return ret;
};

const loadDirectory = async (projectPath: string, basePath: string): Promise<Project.ProjectItems> => {
  const readdir = util.promisify(fs.readdir);
  const files:Array<string> = await readdir(projectPath);
  const ret:Project.ProjectItems = [];
  await Promise.all(files.map(async (filename: string) => {
    const p:string = path.join(projectPath, filename);
    const itemType:Project.ItemType = Project.detectItemTypeByAbsPath(p);

    let items:Project.ProjectItems = [];
    if (itemType === Project.ItemTypeDirectory) {
      items = await loadDirectory(p, basePath);
    }

    ret.push({
      name: filename,
      path: p.replace(basePath, ''),
      itemType,
      items
    });
  }));

  return ret;
};

const openFile = async (projectName: string, itemName: string): Promise<Project.Buffer> => {
  const projectPath:string = getBamjuConfig().projects[projectName];
  const abs:string = path.join(projectPath, itemName);
  const stat:fs.Stats = await util.promisify(fs.stat)(abs);
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

  const ret:Project.Buffer = {
    name: itemName,
    path: path.join(projectName, itemName),
    itemType,
    body: md
  };

  return ret;
};

const openDirectory = async (projectName: string, itemName: string): Promise<Project.Buffer> => {
  const projectPath:string = getBamjuConfig().projects[projectName];
  const abs:string = path.join(projectPath, itemName);
  const files:Array<string> = await util.promisify(fs.readdir)(abs);

  let body:string = '';
  files.forEach((file: string) => {
    body += file;
  });

  const ret:Project.Buffer = {
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
