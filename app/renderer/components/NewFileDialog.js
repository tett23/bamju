// @flow

import React from 'react';
import { ipcRenderer } from 'electron';
import { connect } from 'react-redux';
import FontAwesome from 'react-fontawesome';
import type { ModalState } from '../reducers/modal';
import { closeDialog } from '../actions/modal';
import styles from './NewFileDialog.css';

type Props= {
  formValue: string,
  isOpened: boolean,
  projectName: string,
  closeDialog: typeof closeDialog
};


class newFileDialog extends React.Component<Props> {
  filename: ?HTMLInputElement;

  handleChange(e) {
    this.setState(Object.assign({}, this.state, {
      formValue: e.target.value,
    }));
  }

  render() {
    // console.log('refresh newFileDialog', this.props);

    const visibility = this.props.isOpened ? 'block' : 'none';
    const formValue = this.state == null ? this.props.formValue : this.state.formValue;

    return (
      <div>
        <div
          role="none"
          style={{ display: visibility }}
          className={styles.background}
          onClick={this.props.closeDialog}
          onKeyUp={e => { return checkEsc(e, this.props.closeDialog); }}
        >
          <div className={styles.floatWindow}>
            <label
              className={styles.inputLabel}
              htmlFor="modalNewFileDialogInput"
            >
              <FontAwesome name="plus" />
              <span style={{ paddingLeft: '1rem' }}>new file</span>
            </label>
            <input
              type="text"
              id="modalNewFileDialogInput"
              className={styles.input}
              ref={(input) => { if (input) { input.focus(); } this.filename = input; }}
              value={formValue}
              onClick={cancelPropagation}
              onChange={e => { return this.handleChange(e); }}
              onKeyUp={e => { return checkEnter(e, this.props.projectName, this.props.closeDialog); }}
              placeholder="input file name"
            />
          </div>
        </div>
      </div>
    );
  }
}

function cancelPropagation(e) {
  e.stopPropagation();
}

function checkEsc(e, dispatchClose: typeof closeDialog) {
  e.preventDefault();
  e.stopPropagation();

  if (e.key === 'Escape') {
    dispatchClose();
  }

  return true;
}

function checkEnter(e, projectName: string, dispatchClose: typeof closeDialog) {
  e.stopPropagation();

  if (e.key === 'Enter') {
    ipcRenderer.send('create-file', { projectName, path: e.target.value });

    // NOTE: ここでcloseしないで、create-fileのレスポンスをもとに閉じたほうがいい？
    dispatchClose();
  } else if (e.key === 'Escape') {
    dispatchClose();
  }

  return true;
}

const mapStateToProps = (state: {modal: ModalState}) => {
  return state.modal.newFileDialog;
};

const mapDispatchToProps = (dispatch) => {
  return {
    closeDialog: () => {
      dispatch(closeDialog());
    },
  };
};

const NewFileDialog = connect(mapStateToProps, mapDispatchToProps)(newFileDialog);

export default NewFileDialog;
