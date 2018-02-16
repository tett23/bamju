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
import {
  type MessagesState,
  messages,
  initialMessagesState,
} from './messages';

type __ReturnType<B, F: (...any) => B> = B; /* eslint no-unused-vars:0, flowtype/no-weak-types: 0 */
type $ReturnType<F> = __ReturnType<*, F>;

export type ActionTypes =
  $ReturnType<typeof openBuffer> |
  $ReturnType<typeof bufferUpdated>;

type State = {
  editor: EditorState,
  messages: MessagesState
};

export function initialState(): State {
  return {
    editor: initialEditorState(),
    messages: initialMessagesState(),
  };
}

export function appReducer(s: State, a: ActionTypes) {
  return {
    editor: editor(s.editor, a),
    messages: messages(s.messages, a),
  };
}

export default appReducer;
