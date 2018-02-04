// @flow

import { ipcMain } from 'electron';
import opn from 'opn';
// import * as Project from '../common/project';

const Project = require('../common/project');
const {
  Config, Window: WindowConfig, findWindowConfig, replaceWindowConfig
} = require('../common/bamju_config');

ipcMain.on('open-page', async (e, { windowID, projectName, itemName }) => {
  const buf:?Project.Buffer = await openPage(e, { windowID, projectName, itemName });

  e.sender.send('open-page', buf);
  e.returnValue = buf;
});

ipcMain.on('refresh-tree-view', async (e) => {
  const ret = Project.Manager.getBufferItems();

  e.sender.send('refresh-tree-view', ret);
  e.returnValue = ret;
});

ipcMain.on('open-by-system-editor', async (e, absolutePath: string) => {
  opn(absolutePath);
});

ipcMain.on('add-project', async (e, { path }) => {
  Project.Manager.addProject(path);
  const ret:Array<Project.BufferItem> = (await Project.Manager.loadProjects()).map((item) => {
    return Object.assign({}, item.toBufferItem(), { isOpened: true });
  });

  e.sender.send('refresh-tree-view', ret);
  e.returnValue = ret;
});

ipcMain.on('remove-project', async (e, { path }) => {
  Project.Manager.removeProject(path);
  const ret:Array<Project.BufferItem> = (await Project.Manager.loadProjects()).map((item) => {
    return Object.assign({}, item.toBufferItem(), { isOpened: true });
  });

  e.sender.send('refresh-tree-view', ret);
  e.returnValue = ret;
});

ipcMain.on('close-tree-view-item', async (e, { projectName, path }) => {
  const item:?Project.ProjectItem = Project.Manager.detect(projectName, path);
  if (item == null) {
    return;
  }

  item.items = [];
  item.isLoaded = false;
  item.isOpened = false;

  const ret = {
    projectName,
    path,
    item: Object.assign({}, item.toBufferItem(), { isOpened: true })
  };

  e.sender.send('refresh-tree-view-item', ret);
  e.returnValue = ret;
});

ipcMain.on('open-tree-view-item', async (e, { projectName, path }) => {
  const item:?Project.ProjectItem = Project.Manager.detect(projectName, path);
  if (item == null) {
    return;
  }
  await item.load();

  item.isOpened = true;

  const ret = {
    projectName,
    path,
    item: Object.assign({}, item.toBufferItem(), { isOpened: true })
  };

  e.sender.send('refresh-tree-view-item', ret);
  e.returnValue = ret;
});

ipcMain.on('create-file', async (e, { windowID, projectName, path }: {windowID: string, projectName: string, path: string}) => {
  const info = Project.resolveInternalPath(path);
  info.projectName = info.projectName || projectName;

  const ret = await Project.Manager.createFile(info.projectName, info.path);

  if (ret.success) {
    const item = Project.Manager.detect(projectName, info.path);
    console.log('create-file detect item', item, projectName, info.path);
    if (item) {
      const buf:?Project.Buffer = await openPage(e, { windowID, projectName: item.projectName, itemName: item.path });
      e.sender.send('open-page', buf);
    }

    const rootItem = Project.Manager.find(projectName);
    if (rootItem) {
      const treeUpdateEvent = {
        projectName: rootItem.projectName,
        path: rootItem.path,
        item: Object.assign({}, rootItem.toBufferItem(), { isOpened: true })
      };

      e.sender.send('refresh-tree-view-item', treeUpdateEvent);
    }
  }


  e.sender.send('file-created', ret);
  e.returnValue = ret;
});

async function openPage(e, { windowID, projectName, itemName }: {windowID: string, projectName: string, itemName: string}): Promise<?Project.Buffer> {
  Project.Manager.unwatch();

  try {
    const benchID = `Project.openPage benchmark ${projectName} ${itemName}`;
    console.time(benchID);
    const parseResult:Project.ParseResult = await Project.Manager.getBuffer(projectName, itemName);
    console.timeEnd(benchID);

    if (parseResult.buffer.itemType !== Project.ItemTypeUndefined) {
      const win:?WindowConfig = findWindowConfig(windowID);

      if (win !== null && win !== undefined) {
        win.tabs[0].buffer.projectName = parseResult.buffer.projectName;
        win.tabs[0].buffer.path = parseResult.buffer.path;
        replaceWindowConfig(win);
      }
    }

    if (Config.followChange) {
      watch(e, windowID, projectName, itemName, parseResult);
    }

    return parseResult.buffer;
  } catch (err) {
    console.log('ipcMain open-page', projectName, itemName, err);
  }

  return undefined;
}

function watch(e, windowID: string, projectName: string, itemName: string, parseResult: Project.ParseResult) {
  if (parseResult.itemType === Project.ItemTypeUndefined) {
    return;
  }

  const { absolutePath } = parseResult.buffer;

  // projectName, itemNameは（inline call stackの）一番上の要素のものを使う。子の要素を使うと、子のページが表示されてしまう
  Project.Manager.watch(projectName, absolutePath, () => {
    watchCallback(e, windowID, projectName, itemName);
  });

  parseResult.children.forEach((item: Project.ParseResult) => {
    watch(e, windowID, projectName, itemName, item);
  });
}

async function watchCallback(e, windowID: string, projectName: string, itemName: string) {
  const buf:?Project.Buffer = await openPage(e, { windowID, projectName, itemName });
  console.log('call watchCallback', buf);

  e.sender.send('open-page', buf);
}
