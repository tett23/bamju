// @flow

import React from 'react';
import { connect } from 'react-redux';
import {
  type ModalsState,
} from '../../reducers/modals';
import {
  ModalInputDialog,
  closeAllDialog,
} from '../../actions/modals';
import { InputDialog } from './InputDialog';
import {
  type $ReturnType,
} from '../../common/util';
import styles from './Modals.css';

type Props = $ReturnType<typeof mapStateToProps> & $ReturnType<typeof mapDispatchToProps>;

function modals(props: Props) {
  const items = props.modals.map((item) => {
    switch (item.type) {
    case ModalInputDialog: {
      return (
        <div
          role="none"
          key={item.id}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <InputDialog
            id={item.id}
            label={item.label}
            formValue={item.formValue}
            placeholder={item.placeholder}
            onEnter={item.onEnter}
            onClose={item.onClose}
          />
        </div>
      );
    }
    default: return null;
    }
  });

  const visibility = (items.length >= 1) ? 'block' : 'none';
  const dispatchClose = props.closeAllDialog;

  return (
    <div
      className={styles.modals}
      role="none"
      onKeyUp={(e) => {
        e.stopPropagation();
        e.preventDefault();

        checkEscape(e, dispatchClose);
      }}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();

        dispatchClose();
      }}
    >
      <div className={styles.background} style={{ display: visibility }}>
        <div className={styles.dialogs}>
          {items}
        </div>
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
