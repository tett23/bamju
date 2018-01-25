// @flow

import type { Buffer } from '../../common/project';
import type { ActionType } from '../reducers/main_view';

export const OPEN_PAGE = 'OPEN_PAGE';

export type page = {
  body: string
};

export function openPageByBuffer(buf: Buffer): ActionType {
  return {
    type: OPEN_PAGE,
    buffer: buf
  };
}
