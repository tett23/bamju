// @flow

import * as React from 'react';
import { connect } from 'react-redux';
import {
  type Message as _Message,
  type MessageType,
  MessageTypeInfo,
  MessageTypeDebug,
  MessageTypeError,
  MessageTypeFailed,
  MessageTypeWarning,
  MessageTypeSucceeded,
  isSimilarError,
} from '../../common/message';
import {
  closeMessage,
  closeAllMessages,
} from '../../actions/messages';
import { Button } from './Button';
import styles from './Message.css';

type Props = {
  id: string,
  message: _Message,
  closeMessage: typeof closeMessage,
  closeAllMessages: typeof closeAllMessages
};

function message(props: Props) {
  const messageClass = [styles.message, messageType(props.message.type)].join(' ');

  if (!isSimilarError(props.message)) {
    setTimeout(() => {
      props.closeMessage(props.id);
    }, 10000);
  }

  return (
    <div role="alert" className={messageClass}>
      <Button
        className={styles.closeButton}
        text="close"
        tabIndex={-1}
        onClick={() => { props.closeMessage(props.id); }}
        onKeyUp={e => {
          return checkKey(e, () => {
            props.closeMessage(props.id);
          }, props.closeAllMessages);
        }}
      />
      <p className={styles.messageTitle}>{props.message.type}</p>
      <hr />
      <p className={styles.messageBody}>{props.message.message}</p>
      {messageDebug(props.message) }
    </div>
  );
}

function messageDebug(mes: _Message) {
  if (!isSimilarError(mes)) {
    return null;
  }
  if (mes.stack == null) {
    return null;
  }

  const stackItems = (mes.stack || []).map((item) => {
    return <li>{item}</li>;
  });

  return (
    <div>
      <hr />
      <ul>{stackItems}</ul>
    </div>
  );
}

function messageType(type: MessageType) {
  switch (type) {
  case MessageTypeInfo: return styles.info;
  case MessageTypeDebug: return styles.debug;
  case MessageTypeError: return styles.error;
  case MessageTypeFailed: return styles.failed;
  case MessageTypeWarning: return styles.warning;
  case MessageTypeSucceeded: return styles.succeeded;
  default: return styles.info;
  }
}

function checkKey(e, dispatchClose: ()=>void, dispatchCloseAllMessages: typeof closeAllMessages) {
  if (e == null) {
    return;
  }

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
