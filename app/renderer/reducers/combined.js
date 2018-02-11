// @flow

import {
  combineReducers,
  type Store
} from 'redux';
import {
  ItemTypeUndefined
} from '../../common/metadata';
import {
  type Buffer
} from '../../common/buffer';
import {
  deepCopy,
  deepMerge
} from '../../common/util';

import {
  reloadRepositories,
  updateBuffers,
  addBuffers,
  removeBuffers,
} from '../actions/repositories';
import {
  openBuffer,
  bufferContentUpdated
} from '../actions/tab';
import {
  openNewFileDialog,
  closeDialog,
  updateMessage,
  updateFormValue
} from '../actions/modal';
import {
  addMessage,
  closeMessage,
  closeAllMessages
} from '../actions/messages';

import {
  repositories,
  type RepositoriesState,
  initialRepositoriesState,
} from './repositories';
import {
  browser,
  type BrowserState,
  initialBrowserState,
} from './browser';
import {
  modal,
  type ModalState,
  initialModalState,
} from './modal';
import {
  messages,
  type MessagesState,
  initialMessagesState,
} from './messages';

type __ReturnType<B, F: (...any) => B> = B; /* eslint no-unused-vars:0, flowtype/no-weak-types: 0 */
type $ReturnType<F> = __ReturnType<*, F>;

export type ActionTypes = $ReturnType<typeof openBuffer>
| $ReturnType<typeof bufferContentUpdated>
| $ReturnType<typeof reloadRepositories>
| $ReturnType<typeof updateBuffers>
| $ReturnType<typeof addBuffers>
| $ReturnType<typeof removeBuffers>
| $ReturnType<typeof openNewFileDialog>
| $ReturnType<typeof closeDialog>
| $ReturnType<typeof updateMessage>
| $ReturnType<typeof updateFormValue>
| $ReturnType<typeof addMessage>
| $ReturnType<typeof closeMessage>
| $ReturnType<typeof closeAllMessages>;

type State = {
  browser: BrowserState,
  repositories: RepositoriesState,
  modal: ModalState,
  messages: MessagesState
};

export function initialState(): State {
  return {
    browser: initialBrowserState(),
    repositories: initialRepositoriesState(),
    modal: initialModalState(),
    messages: initialMessagesState(),
  };
}

// なぜかcombineReducerが動かないので無理矢理
export function appReducer(s: State, a: ActionTypes) {
  return {
    browser: browser(s.browser, a),
    repositories: repositories(s.repositories, a),
    modal: modal(s.modal, a),
    messages: messages(s.messages, a)
  };
}

export default appReducer;
