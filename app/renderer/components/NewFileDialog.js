// @flow

import React from 'react';
import { ipcRenderer } from 'electron';
import { connect } from 'react-redux';
import FontAwesome from 'react-fontawesome';
import type { ModalState } from '../reducers/modal';
import { closeDialog } from '../actions/modal';
import styles from './NewFileDialog.css';

type newFileDialogType = {
  formValue: string,
  isOpened: boolean,
  projectName: string,
  closeDialog: typeof closeDialog
};

// const newFileDialogDefault = {
//   text: ''
// };

// const newFileDialog = ({ text, closeDialog }: newFileDialogType = newFileDialogDefault) => {
const newFileDialog = (props: newFileDialogType) => {
  console.log('refresh newFileDialog', props);

  const visibility = props.isOpened ? 'block' : 'none';

  return (
    <div
      role="none"
      style={{ display: visibility }}
      className={styles.background}
      onClick={props.closeDialog}
      onKeyUp={e => { return checkEsc(e, props.closeDialog); }}
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
          value={props.formValue}
          onClick={e => { cancelPropagation(e); }}
          onKeyUp={e => { checkEnter(e, props.projectName, props.closeDialog); }}
        />
      </div>
    </div>
  );
};

function cancelPropagation(e) {
  e.stopPropagation();
}

function checkEsc(e, dispatchClose: typeof closeDialog) {
  e.preventDefault();
  e.stopPropagation();

  dispatchClose();
}

function checkEnter(e, projectName: string, dispatchClose: typeof closeDialog) {
  const value = '';
  ipcRenderer.send('create-file', { projectName, path: value });

  // NOTE: ここでcloseしないで、create-fileのレスポンスをもとに閉じたほうがいい？
  dispatchClose();
}

const mapStateToProps = (state: {modal: ModalState}) => {
  console.log('NewFileDialog mapStateToProps', state);

  return state.modal.newFileDialog;
};

const mapDispatchToProps = (dispatch) => {
  console.log('NewFileDialog mapDispatchToProps', dispatch);

  return {
    closeDialog: () => {
      dispatch(closeDialog());
    },
  };
};

const NewFileDialog = connect(mapStateToProps, mapDispatchToProps)(newFileDialog);

export default NewFileDialog;
