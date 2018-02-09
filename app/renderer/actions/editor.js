// @flow

import {
  type Buffer
} from '../../common/buffer';

export const OPEN_BUFFER = 'OPEN_BUFFER';
export const UPDATE_EDITOR_CONTENT = 'UPDATE_EDITOR_CONTENT';

export function openBuffer(buffer: Buffer) {
  return {
    type: OPEN_BUFFER,
    buffer
  };
}

export function updateEditorContent(text: string) {
  return {
    type: UPDATE_EDITOR_CONTENT,
    text
  };
}
