// @flow

import { type Store } from 'redux';

import {
  type ActionTypes,
  type State,
} from '../reducers/combined';

let _store: Store<*, *>;

export function setStore(store: Store<*, *>) {
  _store = store;
}

export function dispatch(action: ActionTypes) {
  return _store.dispatch(action);
}

export function subscribe(handler: () => void) {
  return _store.subscribe(handler);
}

export function getState(): State {
  return _store.getState();
}
