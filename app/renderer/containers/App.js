// @flow

import React from 'react';
import { connect } from 'react-redux';
import { RepositoriesTreeView } from '../components/RepositoriesTreeView';
import Browser from '../components/Browser';
import { Modals } from '../components/Modals';
import { Messages } from '../components/Messages';
import styles from './App.css';
import {
  type State,
} from '../../reducers/app_window';
import {
  type $ReturnType,
} from '../../common/util';

type Props = $ReturnType<typeof mapStateToProps> & $ReturnType<typeof mapDispatchToProps>;

const app = (props: Props) => {
  return (
    <div className={styles.app} data-tid="app">
      <RepositoriesTreeView buffers={props.global.buffers} />
      <Browser tabs={[props.browser.tabs]} />
      <Modals />
      <Messages />
    </div>
  );
};

function mapStateToProps(state: State): State {
  return state;
}

function mapDispatchToProps(_) {
  return {};
}

const App = connect(mapStateToProps, mapDispatchToProps)(app);

export default App;
