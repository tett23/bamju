// @flow

import {
  type MetaDataID,
} from '../common/metadata';
import {
  type Buffer
} from '../common/buffer';

export const OPEN_BUFFER = Symbol('OPEN_BUFFER');
export const BUFFER_CONTENT_UPDATED = Symbol('BUFFER_CONTENT_UPDATED');

export type page = {
  body: string
};

export function openBuffer(buf: Buffer, content: string) {
  return {
    type: OPEN_BUFFER,
    buffer: buf,
    content,
  };
}

export function bufferContentUpdated(metaDataID: MetaDataID, content: string) {
  return {
    type: BUFFER_CONTENT_UPDATED,
    metaDataID,
    content,
  };
}
