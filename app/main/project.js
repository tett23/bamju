// @flow

import { ipcMain } from 'electron';
import { project, projects, projectItem, projectItems } from '../common/project';
import { getBamjuConfig } from '../common/bamju_config';

const path = require('path');
const fs = require('fs');


ipcMain.on('open-main-page', (event) => {
  const page = openPage('bamju-specifications', 'index');
  event.sender.send('open-page', page);
  event.returnValue = page;
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

  const ret:project = {
    name: projectName,
    path: projectPath,
    items: loadDirectory(projectPath)
  };
  return ret;
};

const loadDirectory = (projectPath: string): projectItems => {
  const files = fs.readdirSync(projectPath);
  const ret:projectItems = [];
  files.forEach((filename: string) => {
    ret.push({
      name: filename,
      path: path.join(projectPath, filename),
      items: []
    });
  });

  return ret;
};

const openPage = (projectName: string, itemName: string): string => {
  const projectPath:string = getBamjuConfig().projects[projectName];
  const fn:string = normalizeName(itemName);
  const abs:string = path.join(projectPath, fn);
  const buf:Buffer = fs.readFileSync(abs);
  const ret:string = buf.toString('UTF-8');

  return ret;
};

// あとで拡張子どうこうする
const normalizeName = (itemName: string): string => `${itemName}.md`;
