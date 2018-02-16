// @flow

import { type Store } from 'redux';

import {
  type ActionTypes,
} from '../reducers/combined';

let _store: Store<*, *>;

export function setStore(store: Store<*, *>) {
  _store = store;
}

export function dispatch(action: ActionTypes) {
  return _store.dispatch(action);
}
