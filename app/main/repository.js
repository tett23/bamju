// @flow

import fs from 'fs';
import opn from 'opn';
import path from '../common/path';
import {
  getInstance,
} from '../common/repository_manager';
import {
  Repository,
} from '../common/repository';
import {
  MetaData,
  resolveInternalPath,
  type MetaDataID
} from '../common/metadata';
import {
  type Buffer
} from '../common/buffer';
import {
  type Message,
  MessageTypeSucceeded,
  MessageTypeFailed,
  MessageTypeError,
} from '../common/util';

export async function openBuffer({ repositoryName, itemName }: {repositoryName: string, itemName: string}): Promise<[Buffer, string] | Message> {
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

  const [parseResult, parseMessage] = await metaData.parse();
  if (parseResult == null || parseMessage.type !== MessageTypeSucceeded) {
    const mes = {
      type: MessageTypeFailed,
      message: `open-page error: '${parseMessage.message}'`,
    };

    return mes;
  }

  const ret = [metaData.toBuffer(), parseResult.content];

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

export async function addRepository(absolutePath: string): Promise<Repository | Message> {
  const repositoryName = path.basename(absolutePath);
  const [repository, message] = await getInstance().addRepository({
    repositoryName,
    absolutePath,
  }, []);
  if (repository == null || message.type !== MessageTypeSucceeded) {
    return {
      type: MessageTypeFailed,
      message: `add-repository error: '${message.message}'`
    };
  }

  return repository;
}

export async function removeRepository(absolutePath: string): Promise<?Repository | Message> {
  const repositoryName = path.basename(absolutePath);
  const repo = getInstance().find(repositoryName);
  if (repo == null) {
    return {
      type: MessageTypeFailed,
      message: `remove-repository error: repository not found. repositoryName=${repositoryName}`
    };
  }

  return getInstance().removeRepository(repositoryName);
}

export async function closeItem(metaDataID: MetaDataID): Promise<Buffer | Message> {
  const metaData = getInstance().getItemByID(metaDataID);
  if (metaData == null) {
    const mes = {
      type: MessageTypeFailed,
      message: `close-item error: metaDataID=${metaDataID}`,
    };
    return mes;
  }

  const repo = metaData.repository();

  const newMetaData = await repo.closeItem(metaData.id);
  if (newMetaData == null) {
    const mes = {
      type: MessageTypeFailed,
      message: `close-item error: repositoryName=${metaData.repositoryName} path=${metaData.path}`,
    };
    return mes;
  }

  return newMetaData.toBuffer();
}

export async function openItem(metaDataID: MetaDataID): Promise<Buffer | Message> {
  const metaData = getInstance().getItemByID(metaDataID);
  if (metaData == null) {
    const mes = {
      type: MessageTypeFailed,
      message: `open-item error: metaDataID=${metaDataID}`,
    };
    return mes;
  }

  const repo = metaData.repository();

  const newMetaData = await repo.openItem(metaData.id);
  if (newMetaData == null) {
    const mes = {
      type: MessageTypeFailed,
      message: `open-item error: repositoryName=${metaData.repositoryName} path=${metaData.path}`,
    };
    return mes;
  }

  return newMetaData.toBuffer();
}

export async function createFile({ repositoryName, path: itemPath }: {repositoryName: string, path: string}): Promise<Buffer | Message> {
  const info = resolveInternalPath(itemPath);
  if (info.repositoryName == null) {
    info.repositoryName = repositoryName;
  }

  const repo = getInstance().find(info.repositoryName || '');
  if (repo == null) {
    const mes = {
      type: MessageTypeFailed,
      message: `create-file repository not found error: repositoryName=${info.repositoryName || ''}`,
    };
    return mes;
  }

  const [metaData, message] = await repo.addFile(info.path, '');
  if (metaData == null || message.type !== MessageTypeSucceeded) {
    const mes = {
      type: MessageTypeFailed,
      message: `create-file error: ${message.message}`,
    };
    return mes;
  }

  await metaData.open();

  return metaData.toBuffer();
}
