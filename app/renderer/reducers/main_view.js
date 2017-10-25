// @flow

import { OPEN_PAGE } from '../actions/tab';
import { REFRESH_TREE_VIEW } from '../actions/tree_view';

type actionType = {
  +type: string
};

type mainViewState= {
  mainView: {
    tab: string,
    projects: Array<Object> // main.js直したときに型定義とりこむ
  }
};

const initialMainViewState = (): mainViewState => ({
  mainView: {
    tab: '',
    projects: []
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
  {
    const newMainView = Object.assign({}, state.mainView, {
      tab: action.page.body
    });

    return Object.assign({}, state, {
      mainView: newMainView
    });
  }
  case REFRESH_TREE_VIEW: {
    const newMainView = Object.assign({}, state.mainView, {
      projects: action.projects
    });

    return Object.assign({}, state, {
      mainView: newMainView
    });
  }
  default:
    return initialMainViewState();
  }
};

export default mainView;
