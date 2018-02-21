// @flow

import { type Store } from 'redux';

import {
  type Actions,
} from '../reducers/types';
import {
  type State,
} from '../reducers/main';

let _store: Store<*, *>;

export function setStore(store: Store<*, *>) {
  _store = store;
}

export function dispatch(action: Actions) {
  return _store.dispatch(action);
}

export function subscribe(handler: () => void) {
  return _store.subscribe(handler);
}

export function getState(): State {
  return _store.getState();
}
