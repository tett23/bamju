// @flow

import React from 'react';
import styles from './ProgressBar.css';

type Props = {
  current: number,
  total: number
};

export function ProgressBar(props: Props) {
  let percentage;
  if (props.total === 0) {
    percentage = 0;
  } else {
    percentage = Math.ceil((props.current / props.total) * 100);
  }

  if (percentage > 100) {
    percentage = 100;
  }

  const style = {
    width: `${percentage}%`
  };

  return (
    <div className={styles.progressBar}>
      <div className={styles.progress} style={style} />
    </div>
  );
}

export default ProgressBar;
