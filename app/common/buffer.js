// @flow

import {
  type MetaDataID,
  type ItemType,
  ItemTypeUndefined,
} from './metadata';

export type Buffer = {
  id: MetaDataID,
  name: string,
  path: string,
  repositoryName: string,
  repositoryPath: string,
  absolutePath: string,
  itemType: ItemType,
  parentID: ?MetaDataID,
  childrenIDs: Array<MetaDataID>,
  isLoaded: boolean,
  body: string,
  note: Note
};

export type Note = {
  outline: string,
  body: string,
  tags: string[],
  label: ?string,
  status: ?string,
  keywords: string[],
  prev: MetaDataID[],
  next: MetaDataID[]
};

export function emptyNote() {
  return {
    outline: '',
    body: '',
    tags: [],
    label: null,
    status: null,
    keywords: [],
    prev: [],
    next: []
  };
}

export function dummyBuffer() {
  return {
    id: '',
    name: 'undefined',
    path: '',
    repositoryName: '',
    repositoryPath: '',
    absolutePath: '',
    itemType: ItemTypeUndefined,
    parentID: null,
    childrenIDs: [],
    isLoaded: false,
    body: '',
    note: emptyNote()
  };
}
