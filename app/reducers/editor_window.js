// @flow

import { type Actions } from './types';
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
