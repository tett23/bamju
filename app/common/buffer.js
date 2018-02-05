// @flow

import {
  type MetaDataID,
  type ItemType,
} from './metadata';

export type Buffer = {
  id: MetaDataID,
  name: string,
  path: string,
  repositoryName: string,
  repositoryPath: string,
  absolutePath: string,
  itemType: ItemType,
  parent: ?Buffer,
  children: Array<Buffer>,
  isLoaded: boolean,
  isOpened: boolean
};
