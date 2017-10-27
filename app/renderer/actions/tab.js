// @flow

import { buffer } from '../../common/project';

export const OPEN_PAGE = 'OPEN_PAGE';

export type page = {
  body: string
};

export function openPageByBuffer(buf: buffer) {
  return {
    type: OPEN_PAGE,
    buffer: buf
  };
}
