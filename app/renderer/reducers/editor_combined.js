// @flow

import { combineReducers } from 'redux';
import type { BufferItem } from '../../common/project';
import { deepCopy, deepMerge } from '../../common/util';

import {
  OPEN_BUFFER,
  openBuffer
} from '../actions/editor';

import { type EditorState } from './editor';

export function initialEditorState(): EditorState {
  return {
    buffer: {
      name: '',
      projectName: '',
      path: '',
      absolutePath: '',
      itemType: 'undefined',
      body: ''
    }
  };
}

export function editor(state: EditorState = initialEditorState(), action: ActionTypes): EditorState {
  console.log(`reducer editor ${action.type}`, action, state);

  switch (action.type) {
  case OPEN_BUFFER: {
    const newState = deepCopy(state);
    newState.buffer = action.buffer;

    return newState;
  }
  default:
    return state;
  }
}

type __ReturnType<B, F: (...any) => B> = B; /* eslint no-unused-vars:0, flowtype/no-weak-types: 0 */
type $ReturnType<F> = __ReturnType<*, F>;

export type ActionTypes = $ReturnType<typeof openBuffer>;

export const appReducer = combineReducers({
  editor,
});

export default appReducer;
