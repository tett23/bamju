// @flow

import {
  type $ReturnType,
} from '../common/util';
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

export type Actions =
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

export function appReducer(s: State, a: Actions) {
  return {
    editor: editor(s.editor, a),
    messages: messages(s.messages, a),
  };
}

export default appReducer;
