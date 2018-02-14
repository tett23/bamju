// @flow

import React from 'react';
import { connect } from 'react-redux';
import styles from './InputDialog.css';
import {
  type InputDialogValues,
  closeDialog,
} from '../actions/modals';

type Props = InputDialogValues & {
  id: string,
  closeDialog: (string) => void
};

class inputDialog extends React.Component<Props> {
  filename: ?HTMLInputElement;
  closeDialog: () => void;
  handleChange: (SyntheticInputEvent<*>) => void;

  static defaultProps = {
    id: '',
    label: '',
    formValue: '',
    placeholder: '',
  }

  constructor(props: Props) {
    super(props);

    this.closeDialog = () => {
      const { id: modalID } = this.props;
      if (props.onClose == null) {
        props.closeDialog(modalID);
        return;
      }

      return props.onClose() && props.closeDialog(modalID);
    };
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(e: SyntheticInputEvent<*>) {
    this.setState(Object.assign({}, this.state, {
      formValue: e.target.value
    }));
  }

  render() {
    const formValue = this.state ? this.state.formValue : this.props.formValue;

    return (
      <div className={styles.inputDialog}>
        <label
          className={styles.label}
          htmlFor="modalNewFileDialogInput"
        >
          <span style={{ paddingLeft: '1rem' }}>{this.props.label}</span>
        </label>
        <input
          type="text"
          id="modalNewFileDialogInput"
          className={styles.input}
          ref={(input) => { if (input) { input.focus(); } this.filename = input; }}
          value={formValue}
          onClick={(e) => { e.stopPropagation(); }}
          onKeyUp={e => {
            return checkEnter(e, this.props.onEnter, this.closeDialog);
          }}
          onChange={this.handleChange}
          placeholder={this.props.placeholder}
        />
      </div>
    );
  }
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
