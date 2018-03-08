// @flow

import React from 'react';
import { connect } from 'react-redux';
import {
  type State,
} from '../../reducers/app_window';
import {
  ModalInputDialog,
  ModalSearchDialog,
  closeAllDialog,
} from '../../actions/modals';
import { InputDialog } from './InputDialog';
import { Search } from './Search';
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
        <InputDialog
          id={item.id}
          parentKey={item.id}
          label={item.label}
          formValue={item.formValue}
          placeholder={item.placeholder}
          onEnter={item.onEnter}
          onClose={item.onClose}
        />
      );
    }
    case ModalSearchDialog: {
      const search = props.searches.find((s) => {
        return item.queryID === s.queryID;
      });
      if (search == null) {
        return null;
      }

      return (<Search parentKey={item.queryID} {...search} />);
    }
    default: return null;
    }
  }).filter(Boolean).map((item) => {
    return (
      <div
        role="none"
        key={item.props.parentKey}
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={styles.dialog}
      >
        {item}
      </div>
    );
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

function mapStateToProps(state: State) {
  return {
    modals: state.modals,
    searches: state.searches,
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
