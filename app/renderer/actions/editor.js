// @flow

import {
  type Buffer
} from '../../common/project';

// export const UPDATE_EDITOR_CONTENT = 'UPDATE_EDITOR_CONTENT'
export const OPEN_BUFFER = 'OPEN_BUFFER';

export function openBuffer(buffer: Buffer) {
  return {
    type: OPEN_BUFFER,
    buffer
  };
}
