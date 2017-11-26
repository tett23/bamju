// @flow

import { ipcMain } from 'electron';
import opn from 'opn';
// import * as Project from '../common/project';

const Project = require('../common/project');
const { Config } = require('../common/bamju_config');

ipcMain.on('open-page', async (e, { projectName, itemName }) => {
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
  Project.Manager.unwatch();

  try {
    const benchID = `Project.openPage benchmark ${projectName} ${itemName}`;
    console.time(benchID);
    const parseResult:Project.ParseResult = await Project.Manager.getBuffer(projectName, itemName);
    console.timeEnd(benchID);

    if (parseResult.buffer.itemType !== Project.ItemTypeUndefined) {
      const win = Object.assign({}, Config.windows[0]);
      win.tabs[0].buffer.projectName = parseResult.buffer.projectName;
      win.tabs[0].buffer.path = parseResult.buffer.path;
      Config.update({ windows: [win] });
    }

    if (Config.followChange) {
      watch(e, projectName, itemName, parseResult);
    }

    return parseResult.buffer;
  } catch (err) {
    console.log('ipcMain open-page', projectName, itemName, err);
  }

  return undefined;
}

function watch(e, projectName: string, itemName: string, parseResult: Project.ParseResult) {
  if (parseResult.itemType === Project.ItemTypeUndefined) {
    return;
  }

  const { absolutePath } = parseResult.buffer;

  // projectName, itemNameは（inline call stackの）一番上の要素のものを使う。子の要素を使うと、子のページが表示されてしまう
  Project.Manager.watch(projectName, absolutePath, () => {
    watchCallback(e, projectName, itemName);
  });

  parseResult.children.forEach((item: Project.ParseResult) => {
    watch(e, projectName, itemName, item);
  });
}

async function watchCallback(e, projectName: string, itemName: string) {
  const buf:?Project.Buffer = await openPage(e, { projectName, itemName });

  e.sender.send('open-page', buf);
}
