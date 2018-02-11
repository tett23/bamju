// @flow

import * as React from 'react';
import { connect } from 'react-redux';
import {
  type Message as MessageType
} from '../../common/util';
import {
  closeMessage,
  closeAllMessages,
} from '../actions/messages';
import styles from './Message.css';

type Props = {
  id: string,
  message: MessageType,
  closeMessage: typeof closeMessage,
  closeAllMessages: typeof closeAllMessages
};

function message(props: Props) {
  const messageClass = [styles.message, message.type];

  return (
    <div className={messageClass}>
      <div
        role="button"
        tabIndex={-1}
        onClick={() => { props.closeMessage(props.id); }}
        onKeyUp={(e) => {
          return checkKey(e, () => {
            props.closeMessage(props.id);
          }, props.closeAllMessages);
        }}
      >
        close
      </div>
      <p className={styles.messageBody}>{props.message.message}</p>
    </div>
  );
}

function checkKey(e, dispatchClose: ()=>void, dispatchCloseAllMessages: typeof closeAllMessages) {
  e.preventDefault();
  e.stopPropagation();

  if (e.key === 'Escape') {
    dispatchCloseAllMessages();
  }
  if (e.key === 'Enter') {
    dispatchClose();
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    closeMessage: (id) => {
      dispatch(closeMessage(id));
    },
    closeAllMessages: () => {
      dispatch(closeAllMessages);
    }
  };
};

export const Message = connect(null, mapDispatchToProps)(message);

export default Message;
