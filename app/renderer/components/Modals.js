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

  return (
    <div
      className={styles.modals}
      role="none"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();

        props.closeAllDialog();
      }}
    >
      {items}
    </div>
  );
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
