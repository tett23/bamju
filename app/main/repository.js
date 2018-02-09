// @flow

import fs from 'fs';
import opn from 'opn';
import path from '../common/path';
import {
  RepositoryManager,
  getInstance,
} from '../common/repository_manager';
import {
  MetaData,
  resolveInternalPath,
} from '../common/metadata';
import {
  type Buffer
} from '../common/buffer';
import {
  Config,
  Window as WindowConfig,
  findWindowConfig,
  replaceWindowConfig
} from '../common/bamju_config';
import {
  type Message,
  MessageTypeSucceeded,
  MessageTypeFailed,
  MessageTypeError,
} from '../common/util';

export async function openPage({ repositoryName, itemName }: {repositoryName: string, itemName: string}): Promise<[Buffer, string] | Message> {
  const repo = getInstance().find(repositoryName);
  if (repo == null) {
    const mes = {
      type: MessageTypeFailed,
      message: `open-page repository not found: repositoryName=${repositoryName}`,
    };

    return mes;
  }

  const metaData = repo.detect(itemName);
  if (metaData == null) {
    const mes = {
      type: MessageTypeFailed,
      message: `open-page detect error: repositoryName=${repositoryName} itemName=${itemName}`,
    };

    return mes;
  }

  const [content, getContentMessage] = await metaData.getContent();
  if (getContentMessage.type !== MessageTypeSucceeded) {
    const mes = {
      type: MessageTypeFailed,
      message: `open-page error: '${getContentMessage.message}'`,
    };

    return mes;
  }

  const ret = [metaData.toBuffer(), content];

  return ret;
}

export async function buffers(): Promise<{[string]: Buffer[]} | Message> {
  const ret = getInstance().toBuffers();

  return ret;
}

export async function openBySystemEditor({ absolutePath }: MetaData): Promise<boolean | Message> {
  try {
    fs.statSync(absolutePath);
  } catch (e) {
    return {
      type: MessageTypeError,
      message: `open-by-system-editor stat error: ${e.message}`
    };
  }

  if (process.env.NODE_ENV !== 'test') {
    opn(absolutePath);
  }

  return true;
}

export async function addProject(absolutePath: string): Promise<{[string]: Buffer[]} | Message> {
  const repositoryName = path.basename(absolutePath);
  const [repository, message] = await getInstance().addRepository({
    repositoryName,
    absolutePath,
  }, []);
  if (repository == null || message !== MessageTypeSucceeded) {
    return {
      type: MessageTypeFailed,
      message: `add-project error: ${message.message}`
    };
  }

  return getInstance().toBuffers();
}
//
// ipcMain.on('remove-project', async (e, { absolutePath }) => {
//   const repositoryName = path.basename(absolutePath);
//   getInstance().removeRepository(repositoryName);
//
//   const ret = getInstance().toBuffers();
//
//   e.sender.send('refresh-tree-view', ret);
//   e.returnValue = ret;
// });
//
// ipcMain.on('close-tree-view-item', async (e, { repositoryName, itemPath }) => {
//   const repo = getInstance().find(repositoryName);
//   if (repo == null) {
//     const mes = {
//       type: MessageTypeFailed,
//       message: 'close-tree-view-item error',
//     };
//     e.sender.send('message', mes);
//     e.returnValue = null;
//     return;
//   }
//
//   const metaData = repo.closeItem(itemPath);
//   if (metaData == null) {
//     const mes = {
//       type: MessageTypeFailed,
//       message: 'close-tree-view-item error',
//     };
//     e.sender.send('message', mes);
//     e.returnValue = null;
//     return;
//   }
//
//   const ret = {
//     repositoryName,
//     metaData: metaData.toBuffer()
//   };
//
//   e.sender.send('refresh-tree-view-item', ret);
//   e.returnValue = ret;
// });
//
// ipcMain.on('open-tree-view-item', async (e, { repositoryName, itemPath }) => {
//   const repo = getInstance().find(repositoryName);
//   if (repo == null) {
//     const mes = {
//       type: MessageTypeFailed,
//       message: 'open-tree-view-item error',
//     };
//     e.sender.send('message', mes);
//     e.returnValue = null;
//     return;
//   }
//
//   const metaData = await repo.openItem(itemPath);
//   if (metaData == null) {
//     const mes = {
//       type: MessageTypeFailed,
//       message: 'open-tree-view-item error',
//     };
//     e.sender.send('message', mes);
//     e.returnValue = null;
//     return;
//   }
//
//   const ret = {
//     repositoryName,
//     metaData: metaData.toBuffer()
//   };
//
//   e.sender.send('refresh-tree-view-item', ret);
//   e.returnValue = ret;
// });
//
// ipcMain.on('create-file', async (e, { repositoryName, itemPath }: { repositoryName: string, itemPath: string}) => {
//   const info = resolveInternalPath(itemPath);
//   info.repositoryName = info.repositoryName || repositoryName;
//
//   const repo = getInstance().find(repositoryName);
//   if (repo == null) {
//     const mes = {
//       type: MessageTypeFailed,
//       message: 'close-tree-view-item error',
//     };
//     e.sender.send('message', mes);
//     e.returnValue = null;
//     return;
//   }
//
//   const [metaData, message] = await repo.addFile(info.path, '');
//   if (metaData == null || message.type !== MessageTypeSucceeded) {
//     const mes = {
//       type: MessageTypeFailed,
//       message: message.message,
//     };
//     e.sender.send('message', mes);
//     e.returnValue = null;
//     return;
//   }
//
//   const content = await metaData.getContent();
//   e.sender.send('open-page', [metaData, content]);
//
//   await metaData.open();
//
//   e.sender.send('refresh-tree-view', repo.toBuffers());
//
//   e.sender.send('file-created', metaData);
//   e.returnValue = metaData;
// });
