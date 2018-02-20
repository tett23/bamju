// @flow

import {
  type Store,
  type Dispatch,
} from 'redux';
import {
  type State,
  type Actions,
} from '../reducers/app_window';

export const windowMetaMiddleware = (_: Store<State, Actions>) => (next: Dispatch<Actions>) => (action: Actions) => {
  const newAction = Object.assign({}, action);
  newAction.meta = newAction.meta || {};
  newAction.meta.windowID = window.id;

  // $FlowFixMe
  return next(newAction);
};

export default windowMetaMiddleware;
