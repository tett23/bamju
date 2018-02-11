// @flow

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

type State = {
  editor: EditorState
};

export function initialState(): State {
  return {
    editor: initialEditorState()
  };
}

export function appReducer(s: State, a: ActionTypes) {
  return {
    editor: editor(s.editor, a),
  };
}

export default appReducer;
