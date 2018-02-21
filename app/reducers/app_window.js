// @flow

import {
  type $ReturnType,
} from '../common/util';

import {
  addTab,
  closeTab,
  updateTab,
} from '../actions/browser';
import {
  initializeRepositoriesTreeView,
  openBuffer,
  closeBuffer,
} from '../actions/repositories_tree_view';
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
  browser,
  type BrowserState,
  initialBrowserState,
} from './browser';
import {
  repositoriesTreeView,
  type RepositoriesTreeViewState,
  initialRepositoriesTreeViewState,
} from './repositories_tree_view';
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

import {
  appReducer as globalReducer,
  type State as GlobalState,
  initialState as initialGlobalState,
} from './global';

export type Actions = $ReturnType<typeof addTab>
| $ReturnType<typeof closeTab>
| $ReturnType<typeof updateTab>
| $ReturnType<typeof initializeRepositoriesTreeView>
| $ReturnType<typeof openBuffer>
| $ReturnType<typeof closeBuffer>
| $ReturnType<typeof openInputDialog>
| $ReturnType<typeof closeDialog>
| $ReturnType<typeof closeAllDialog>
| $ReturnType<typeof addMessage>
| $ReturnType<typeof closeMessage>
| $ReturnType<typeof closeAllMessages>;

export type State = {
  browser: BrowserState,
  repositoriesTreeView: RepositoriesTreeViewState,
  modals: ModalsState,
  messages: MessagesState,
  global: GlobalState
};

export function initialState(): State {
  return {
    browser: initialBrowserState(),
    repositoriesTreeView: initialRepositoriesTreeViewState(),
    modals: initialModalsState(),
    messages: initialMessagesState(),
    global: initialGlobalState(),
  };
}

// なぜかcombineReducerが動かないので無理矢理
export function appReducer(s: State, a: Actions) {
  return {
    browser: browser(s.browser, a),
    repositoriesTreeView: repositoriesTreeView(s.repositoriesTreeView, a),
    modals: modals(s.modals, a),
    messages: messages(s.messages, a),
    global: globalReducer(s.global, a)
  };
}

export default appReducer;
