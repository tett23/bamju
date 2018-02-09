// @flow

import { combineReducers } from 'redux';
import {
  type Buffer
} from '../../common/buffer';
import {
  ItemTypeUndefined
} from '../../common/metadata';
import { deepCopy, deepMerge } from '../../common/util';

import {
  OPEN_BUFFER,
  UPDATE_EDITOR_CONTENT,
  openBuffer,
  updateEditorContent
} from '../actions/editor';

import { type EditorState } from './editor';

export function initialEditorState(): EditorState {
  return {
    buffer: {
      id: '',
      name: '',
      path: '',
      repositoryName: '',
      repositoryPath: '',
      absolutePath: '',
      itemType: ItemTypeUndefined,
      parentID: null,
      childrenIDs: [],
      isOpened: false,
      isLoaded: false,
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
  case UPDATE_EDITOR_CONTENT: {
    const newState = deepCopy(state);
    newState.buffer.body = action.text;

    return newState;
  }
  default:
    return state;
  }
}

type __ReturnType<B, F: (...any) => B> = B; /* eslint no-unused-vars:0, flowtype/no-weak-types: 0 */
type $ReturnType<F> = __ReturnType<*, F>;

export type ActionTypes =
  $ReturnType<typeof openBuffer> |
  $ReturnType<typeof updateEditorContent>;

export const appReducer = combineReducers({
  editor,
});

export default appReducer;
