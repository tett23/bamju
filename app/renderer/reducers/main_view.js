// @flow

import { OPEN_PAGE } from '../actions/tab';
import { REFRESH_TREE_VIEW } from '../actions/tree_view';

type actionType = {
  +type: string
};

type mainViewState= {
  mainView: {
    projects: Array<Object>, // main.js直したときに型定義とりこむ
    browser: browser
  }
};

type browser = {
  tabs: Array<tab>
};

type tab = {
  name: string,
  path: string,
  buf: string
};

const initialMainViewState = (): mainViewState => ({
  mainView: {
    projects: [],
    browser: {
      tabs: [
        {
          name: '',
          path: '',
          buf: ''
        }
      ]
    }
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
      browser: {
        tabs: [
          {
            name: '',
            path: '',
            buf: action.page.body
          }
        ]
      }
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
