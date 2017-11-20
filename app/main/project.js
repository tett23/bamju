// @flow

import { ipcMain } from 'electron';
import opn from 'opn';
import * as Project from '../common/project';

ipcMain.on('open-main-page', async (e) => {
  try {
    const buf:Project.Buffer = await Project.Manager.getBuffer('bamju-specifications', 'index.md');

    e.sender.send('open-page', buf);
    e.returnValue = buf;
  } catch (err) {
    console.log('ipcMain open-main-page', 'bamju-specifications', 'index.md', err);
  }
});

ipcMain.on('open-page', async (e, { projectName, itemName }) => {
  try {
    const buf:Project.Buffer = await Project.Manager.getBuffer(projectName, itemName);

    e.sender.send('open-page', buf);
    e.returnValue = buf;
  } catch (err) {
    console.log('ipcMain open-page', projectName, itemName, err);
  }
});

ipcMain.on('refresh-tree-view', async (e) => {
  // console.log('refresh-tree-view ret', manager.projects);
  const ret:Project.Projects = await Project.Manager.loadProjects();

  e.sender.send('refresh-tree-view', ret);
  e.returnValue = ret;
});

ipcMain.on('open-by-editor', async (e, absolutePath: string) => {
  opn(absolutePath);
});

// const loadProjects = async (): Promise<Project.Projects> => {
//   const ret:Project.Projects = [];
//
//   const projectNames:Array<string> = Object.keys(Config.projects);
//   await Promise.all(projectNames.map(async (projectName: string) => {
//     ret.push(await loadProject(projectName));
//   }));
//
//   return ret;
// };
//
// const loadProject = async (projectName: string): Promise<Project.Project> => {
//   const projectPath:string = Config.projects[projectName];
//   if (projectPath === undefined) {
//     throw new Error(`loadProject error${projectName}`);
//   }
//
//   const basePath:string = path.dirname(projectPath);
//
//   const ret:Project.Project = {
//     name: projectName,
//     path: '/',
//     absolutePath: projectPath,
//     itemType: 'project',
//     items: await loadDirectory(projectPath, basePath)
//   };
//
//   return ret;
// };
//
// const loadDirectory = async (projectPath: string, basePath: string): Promise<Project.ProjectItems> => {
//   const files:Array<string> = await util.promisify(fs.readdir)(projectPath);
//   const ret:Project.ProjectItems = [];
//   await Promise.all(files.map(async (filename: string) => {
//     const p:string = path.join(projectPath, filename);
//     const itemType:Project.ItemType = Project.detectItemTypeByAbsPath(p);
//
//     let items:Project.ProjectItems = [];
//     if (itemType === Project.ItemTypeDirectory) {
//       items = await loadDirectory(p, basePath);
//     }
//
//     ret.push({
//       name: filename,
//       path: p.replace(basePath, ''),
//       absolutePath: p,
//       itemType,
//       items
//     });
//   }));
//
//   return ret;
// };
//
// const openFile = async (projectName: string, itemName: string): Promise<Project.Buffer> => {
//   const projectPath:string = Config.projects[projectName];
//   const abs:string = path.join(projectPath, itemName);
//   const stat:fs.Stats = await util.promisify(fs.stat)(abs);
//   if (stat.isDirectory()) {
//     return openDirectory(projectName, itemName);
//   }
//
//   const html:string = await Markdown.parse(projectName, abs);
//   const itemType:Project.ItemType = Project.detectItemType(projectName, itemName);
//
//   const ret:Project.Buffer = {
//     name: itemName,
//     path: path.join(projectName, itemName),
//     absolutePath: abs,
//     itemType,
//     body: html
//   };
//
//   return ret;
// };
//
// const openDirectory = async (projectName: string, itemName: string): Promise<Project.Buffer> => {
//   const projectPath:string = Config.projects[projectName];
//   const abs:string = path.join(projectPath, itemName);
//   const files:Array<string> = await util.promisify(fs.readdir)(abs);
//
//   let body:string = '';
//   files.forEach((file: string) => {
//     body += file;
//   });
//
//   const ret:Project.Buffer = {
//     name: itemName,
//     path: path.join(projectName, itemName),
//     absolutePath: abs,
//     itemType: Project.ItemTypeDirectory,
//     body
//   };
//
//   return ret;
// };
