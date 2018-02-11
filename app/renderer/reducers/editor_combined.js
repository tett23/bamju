// @flow

import { combineReducers } from 'redux';
import {
  openBuffer,
  bufferUpdated,
} from '../actions/editor';
import {
  type EditorState,
  editor,
  initialEditorState,
} from './editor';

type __ReturnType<B, F: (...any) => B> = B; /* eslint no-unused-vars:0, flowtype/no-weak-types: 0 */
type $ReturnType<F> = __ReturnType<*, F>;

export type ActionTypes =
  $ReturnType<typeof openBuffer> |
  $ReturnType<typeof bufferUpdated>;

export const appReducer = combineReducers({
  editor,
});

export function initialState() {
  return {
    editor: initialEditorState()
  };
}

export default appReducer;
