// @flow

import {
  type $ReturnType,
} from '../common/util';

import {
  initializeWindows,
  newWindow,
  closeWindow,
} from '../actions/windows';

import {
  windows,
  type WindowsState,
  initialWindowsState,
} from './windows';

import {
  appReducer as globalReducer,
  type State as GlobalState,
  initialState as initialGlobalState,
} from './global';

export type Actions = $ReturnType<typeof initializeWindows>
| $ReturnType<typeof newWindow>
| $ReturnType<typeof closeWindow>;

export type State = {
  windows: WindowsState,
  global: GlobalState
};

export function initialState(): State {
  return {
    windows: initialWindowsState(),
    global: initialGlobalState(),
  };
}

// なぜかcombineReducerが動かないので無理矢理
export function appReducer(s: State, a: Actions) {
  return {
    windows: windows(s.windows, a),
    global: globalReducer(s.global, a)
  };
}

export default appReducer;
