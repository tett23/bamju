// @flow

import { OPEN_PAGE } from '../actions/tab';
import { REFRESH_TREE_VIEW } from '../actions/tree_view';
import { Projects, Buffer } from '../../common/project';

type actionType = {
  +type: string
};

type mainViewState= {
  mainView: {
    projects: Projects,
    browser: browser
  }
};

type browser = {
  tabs: Array<Buffer>
};

const initialMainViewState = (): mainViewState => ({
  mainView: {
    projects: [],
    browser: {
      tabs: [
        {
          name: '',
          path: '',
          body: ''
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
  case OPEN_PAGE: {
    const newMainView = Object.assign({}, state.mainView, {
      browser: {
        tabs: [action.buffer]
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
