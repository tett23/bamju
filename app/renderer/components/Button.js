// @flow

import * as React from 'react';
import styles from './Button.css';

type Props = {
  text: string,
  className: string,
  tabIndex: number,
  onClick: () => void,
  onKeyUp: () => void
};

export function Button(props: Props) {
  return (
    <div
      className={[styles.button, props.className].join(' ')}
      role="button"
      tabIndex={props.tabIndex}
      onClick={props.onClick}
      onKeyUp={props.onKeyUp}
    >
      <span>{props.text}</span>
    </div>
  );
}

export default Button;
