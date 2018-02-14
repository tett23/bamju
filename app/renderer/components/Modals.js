// @flow

import React from 'react';
import { connect } from 'react-redux';
import {
  type ModalsState,
} from '../reducers/modals';
import {
  ModalInputDialog,
  closeAllDialog,
} from '../actions/modals';
import { InputDialog } from './InputDialog';
import styles from './Modals.css';

type Props = {
  modals: ModalsState,
  closeAllDialog: typeof closeAllDialog
};

function modals(props: Props) {
  const items = props.modals.map((item) => {
    switch (item.type) {
    case ModalInputDialog: {
      return (<InputDialog
        key={item.id}
        id={item.id}
        label={item.label}
        formValue={item.formValue}
        placeholder={item.placeholder}
        onEnter={item.onEnter}
        onClose={item.onClose}
      />);
    }
    default: return null;
    }
  });

  let background;
  if (items.length >= 1) {
    background = <div className={styles.background} />;
  }

  return (
    <div
      className={styles.modals}
      role="none"
      onKeyUp={(e) => {
        e.stopPropagation();
        e.preventDefault();

        checkEscape(e, props.closeAllDialog);
      }}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();

        props.closeAllDialog();
      }}
    >
      {background}
      <div className={styles.dialogs}>
        {items}
      </div>
    </div>
  );
}

function checkEscape(e, close) {
  if (e.key === 'Escape') {
    close();
  }
}

function mapStateToProps(state: {modals: ModalsState}): {modals: ModalsState} {
  return {
    modals: state.modals
  };
}

function mapDispatchToProps(dispatch) {
  return {
    closeAllDialog: () => {
      dispatch(closeAllDialog());
    }
  };
}

export const Modals = connect(mapStateToProps, mapDispatchToProps)(modals);

export default Modals;
