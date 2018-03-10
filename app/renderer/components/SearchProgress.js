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
  return (
    <div className={styles.searchProgress}>
      <div className={styles.progressBar}>
        <ProgressBar {...props.progress} />
      </div>
      <div className={styles.count}>
        <span>{props.progress.current}</span>
        <span>/</span>
        <span>{props.progress.total}</span>
      </div>
    </div>
  );
}

export default SearchProgress;
