// @flow

import { combineReducers } from 'redux';
import mainView from './main_view';

const appReducer = combineReducers({
  mainView,
});

export default appReducer;
