// @flow

import { type Actions } from './types';

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
    repositoriesTreeView: repositoriesTreeView(s.repositoriesTreeView, a, s.global.buffers),
    modals: modals(s.modals, a),
    messages: messages(s.messages, a),
    global: globalReducer(s.global, a)
  };
}

export default appReducer;
