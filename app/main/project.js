// @flow

import fs from 'fs';
import { ipcMain } from 'electron';
import opn from 'opn';
import Config from '../common/bamju_config';
import * as Project from '../common/project';

let watchFile:string = '';

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
  fs.unwatchFile(watchFile);

  const buf:?Project.Buffer = await openPage(e, { projectName, itemName });

  e.sender.send('open-page', buf);
  e.returnValue = buf;
});

ipcMain.on('refresh-tree-view', async (e) => {
  const ret:Project.Projects = await Project.Manager.loadProjects();

  e.sender.send('refresh-tree-view', ret);
  e.returnValue = ret;
});

ipcMain.on('open-by-editor', async (e, absolutePath: string) => {
  opn(absolutePath);
});

ipcMain.on('add-project', async (e, { path }) => {
  Project.Manager.addProject(path);
  const ret:Project.Projects = Project.Manager.projects();

  e.sender.send('refresh-tree-view', ret);
  e.returnValue = ret;
});

ipcMain.on('remove-project', async (e, { path }) => {
  Project.Manager.removeProject(path);
  const ret:Project.Projects = Project.Manager.projects();

  e.sender.send('refresh-tree-view', ret);
  e.returnValue = ret;
});

async function openPage(e, { projectName, itemName }: {projectName: string, itemName: string}): Promise<?Project.Buffer> {
  console.log('openFile', projectName, itemName);
  try {
    const buf:Project.Buffer = await Project.Manager.getBuffer(projectName, itemName);

    if (Config.followChange) {
      watchFile = buf.absolutePath;
      fs.unwatchFile(watchFile);
      fs.watchFile(watchFile, {}, () => {
        openPage(e, { projectName, itemName }).then((b: ?Project.Buffer) => {
          e.sender.send('open-page', b);
          return b;
        }).catch((err) => {
          console.log('watch', err);
        });
      });
    }

    return buf;
  } catch (err) {
    console.log('ipcMain open-page', projectName, itemName, err);
  }

  return undefined;
}
