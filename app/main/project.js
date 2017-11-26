// @flow

import { ipcMain } from 'electron';
import opn from 'opn';
import Config from '../common/bamju_config';
import * as Project from '../common/project';

ipcMain.on('open-main-page', async (e) => {
  await Project.Manager.loadProjects();

  let { projectName, path } = Config.windows[0].tabs[0].buffer;

  try {
    if (!projectName || !path) {
      projectName = 'bamju-specifications';
      path = 'index.md';
    }
    const buf:Project.Buffer = await Project.Manager.getBuffer(projectName, path);

    e.sender.send('open-page', buf);
    e.returnValue = buf;
  } catch (err) {
    console.log('ipcMain open-main-page', 'bamju-specifications', 'index.md', err);
  }
});

ipcMain.on('open-page', async (e, { projectName, itemName }) => {
  Project.Manager.unwatch();

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
  try {
    const buf:Project.Buffer = await Project.Manager.getBuffer(projectName, itemName);

    if (buf.itemType !== 'undefined') {
      const win = Object.assign({}, Config.windows[0]);
      win.tabs[0].buffer.projectName = buf.projectName;
      win.tabs[0].buffer.path = buf.path;
      Config.update({ windows: [win] });
    }

    if (Config.followChange) {
      Project.Manager.watch(projectName, buf.absolutePath, () => {
        watchCallback(e, projectName, itemName);
      });
    }

    return buf;
  } catch (err) {
    console.log('ipcMain open-page', projectName, itemName, err);
  }

  return undefined;
}

async function watchCallback(e, projectName: string, itemName: string) {
  openPage(e, { projectName, itemName }).then((b: ?Project.Buffer) => {
    e.sender.send('open-page', b);
    return b;
  }).catch((err) => {
    console.log('watch', err);
  });
}
