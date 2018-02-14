// @flow

import React from 'react';
import { connect } from 'react-redux';
import styles from './NewFileDialog.css';
import {
  type InputDialogValues,
  closeDialog,
} from '../actions/modals';

type Props = InputDialogValues & {
  id: string,
  closeDialog: (string) => void
};

class inputDialog extends React.Component<Props> {
  render() {
    const { id: modalID } = this.props;
    const onClose = () => {
      if (this.props.onClose == null) {
        this.props.closeDialog(modalID);
        return;
      }

      return this.props.onClose() && this.props.closeDialog(modalID);
    };

    return (
      <div
        role="none"
        className={styles.inputDialog}
        onClick={this.props.closeDialog}
        onKeyUp={e => { return checkEsc(e, onClose); }}
      >
        <div className={styles.floatWindow}>
          <label
            className={styles.inputLabel}
            htmlFor="modalNewFileDialogInput"
          >
            <span style={{ paddingLeft: '1rem' }}>{this.props.label}</span>
          </label>
          <input
            type="text"
            id="modalNewFileDialogInput"
            className={styles.input}
            ref={(input) => { if (input) { input.focus(); } }}
            value={this.props.formValue}
            onClick={(e) => { e.stopPropagation(); }}
            onKeyUp={e => {
              return checkEnter(e, this.props.onEnter, onClose);
            }}
            placeholder={this.props.placeholder}
          />
        </div>
      </div>
    );
  }
}

function checkEsc(e, onClose) {
  e.preventDefault();
  e.stopPropagation();

  if (e.key === 'Escape') {
    onClose();
  }

  return true;
}

function checkEnter(e, onEnter, onClose) {
  e.stopPropagation();

  if (e.key === 'Enter') {
    onEnter(e.target.value);
    return false;
  } else if (e.key === 'Escape') {
    onClose();
    return false;
  }

  return true;
}

function mapDispatchToProps(dispatch) {
  return {
    closeDialog: (id: string) => {
      dispatch(closeDialog(id));
    }
  };
}

export const InputDialog = connect(null, mapDispatchToProps)(inputDialog);

export default InputDialog;
