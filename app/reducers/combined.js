// @flow

import {
  combineReducers,
  type Store
} from 'redux';
import {
  ItemTypeUndefined
} from '../common/metadata';
import {
  type Buffer
} from '../common/buffer';
import {
  deepCopy,
  deepMerge
} from '../common/util';

import {
  reloadRepositories,
  updateBuffers,
} from '../actions/repositories';
import {
  initializeWindows,
  newWindow,
  closeWindow,
  addTab,
  closeTab,
  updateTab,
} from '../actions/windows';
import {
  openBuffer,
  bufferContentUpdated
} from '../actions/tab';
import {
  openInputDialog,
  closeDialog,
  closeAllDialog,
} from '../actions/modals';
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
  windows,
  type WindowsState,
  initialWindowsState,
} from './windows';
import {
  browser,
  type BrowserState,
  initialBrowserState,
} from './browser';
import {
  modals,
  type ModalsState,
  initialModalsState,
} from './modals';
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
| $ReturnType<typeof initializeWindows>
| $ReturnType<typeof newWindow>
| $ReturnType<typeof closeWindow>
| $ReturnType<typeof addTab>
| $ReturnType<typeof closeTab>
| $ReturnType<typeof updateTab>
| $ReturnType<typeof openInputDialog>
| $ReturnType<typeof closeDialog>
| $ReturnType<typeof closeAllDialog>
| $ReturnType<typeof addMessage>
| $ReturnType<typeof closeMessage>
| $ReturnType<typeof closeAllMessages>;

type State = {
  browser: BrowserState,
  repositories: RepositoriesState,
  windows: WindowsState,
  modals: ModalsState,
  messages: MessagesState
};

export function initialState(): State {
  return {
    browser: initialBrowserState(),
    repositories: initialRepositoriesState(),
    windows: initialWindowsState(),
    modals: initialModalsState(),
    messages: initialMessagesState(),
  };
}

// なぜかcombineReducerが動かないので無理矢理
export function appReducer(s: State, a: ActionTypes) {
  return {
    browser: browser(s.browser, a),
    repositories: repositories(s.repositories, a),
    windows: windows(s.windows, a),
    modals: modals(s.modals, a),
    messages: messages(s.messages, a)
  };
}

export default appReducer;
