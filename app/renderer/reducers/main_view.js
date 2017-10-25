// @flow

import { OPEN_PAGE } from '../actions/tab';

type actionType = {
  +type: string
};

type mainViewState= {
  mainView: {
    tab: string
  }
};

const initialMainViewState = (): mainViewState => ({
  mainView: {
    tab: ''
  }
});
export { initialMainViewState };


const mainView = (state: ?mainViewState, action: ?actionType): mainViewState => {
  console.log(`reducer mainView ${action.type}`, action, state);
  if (!state) {
    return initialMainViewState();
  }
  if (!action) {
    return state;
  }

  switch (action.type) {
  case OPEN_PAGE:
    return Object.assign({}, state, {
      mainView: {
        tab: action.page.body
      }
    });
  default:
    return initialMainViewState();
  }
};

export default mainView;
