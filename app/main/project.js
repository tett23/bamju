// @flow

import { ipcMain } from 'electron';
import { project, projects, projectItems, buffer } from '../common/project';
import { getBamjuConfig } from '../common/bamju_config';

const path = require('path');
const fs = require('fs');


ipcMain.on('open-main-page', (event) => {
  const buf = openFile('bamju-specifications', 'index');

  event.sender.send('open-page', buf);
  event.returnValue = buf;
});

ipcMain.on('open-page', (event, args) => {
  const buf = openFile(args.project, args.path);

  event.sender.send('open-page', buf);
  event.returnValue = buf;
});

ipcMain.on('refresh-tree-view', (event, projectName: ?string) => {
  let tree:projects = [];
  if (projectName != null) {
    tree.push(loadProject(projectName));
  } else {
    tree = loadProjects();
  }

  event.sender.send('refresh-tree-view', tree);
  event.returnValue = tree;
});

const loadProjects = (): projects => {
  const ret:projects = [];

  console.log('loadProjects', getBamjuConfig().projects);
  Object.keys(getBamjuConfig().projects).forEach((projectName: string) => {
    ret.push(loadProject(projectName));
  });

  return ret;
};

const loadProject = (projectName: string): project => {
  const projectPath:string = getBamjuConfig().projects[projectName];
  if (projectPath === undefined) {
    throw new Error(`loadProject error${projectName}`);
  }

  const basePath:string = path.dirname(projectPath);

  const ret:project = {
    name: projectName,
    path: '/',
    items: loadDirectory(projectPath, basePath)
  };
  return ret;
};

const loadDirectory = (projectPath: string, basePath: string): projectItems => {
  const files = fs.readdirSync(projectPath);
  const ret:projectItems = [];
  files.forEach((filename: string) => {
    ret.push({
      name: filename,
      path: path.join(projectPath, filename).replace(basePath, ''),
      items: []
    });
  });

  return ret;
};

const openFile = (projectName: string, itemName: string): buffer => {
  const projectPath:string = getBamjuConfig().projects[projectName];
  const fn:string = normalizeName(itemName);
  const abs:string = path.join(projectPath, fn);
  const buf:Buffer = fs.readFileSync(abs);
  const body:string = buf.toString('UTF-8');

  const ret:buffer = {
    name: itemName,
    path: path.join(projectName, fn),
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
