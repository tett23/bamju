// @flow

import React from 'react';
import {
  type SearchProgress as Progress,
} from '../../common/search';
import ProgressBar from './ProgressBar';
import styles from './SearchProgress.css';

type Props = {
  progress: Progress,
  completed: boolean
};

function SearchProgress(props: Props) {
  let circle = null;
  if (!props.completed) {
    circle = <div>loading</div>;
  }

  return (
    <div className={styles.searchProgress}>
      <ProgressBar {...props.progress} />
      <div className={styles.count}>
        <span>{props.progress.current}</span>
        <span>/</span>
        <span>{props.progress.total}</span>
      </div>
      {circle}
    </div>
  );
}

export default SearchProgress;
