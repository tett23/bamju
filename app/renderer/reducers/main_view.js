// @flow

type actionType = {
  +type: string
};

type mainViewState= {
};

const initialMainViewState = (): mainViewState => ({
  mainView: {
    tab: ''
  }
});
export { initialMainViewState };


const mainView = (state: ?mainViewState, action: ?actionType): mainViewState => {
  if (!state) {
    return initialMainViewState();
  }
  if (!action) {
    return state;
  }

  console.log(`reducer mainView ${action.type}`);
  switch (action.type) {
  default:
    return initialMainViewState();
  }
};

export default mainView;
