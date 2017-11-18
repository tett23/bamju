// @flow

import type { Buffer } from '../../common/project';

export const OPEN_PAGE = 'OPEN_PAGE';

export type page = {
  body: string
};

export function openPageByBuffer(buf: Buffer) {
  return {
    type: OPEN_PAGE,
    buffer: buf
  };
}
