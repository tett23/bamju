// @flow

import * as React from 'react';
import { connect } from 'react-redux';
import {
  type MessagesState
} from '../../reducers/messages';
import { Message } from './Message';
import styles from './Message.css';

type Props = {
  messages: MessagesState
};

function messages(props: Props) {
  const messageItems = props.messages.map((item) => {
    const key = Math.random();
    return (<Message key={key} id={item.id} message={item.message} />);
  });

  return (<div className={styles.messages}>{messageItems}</div>);
}

function mapStateToProps(state: {messages: MessagesState}): Props {
  return {
    messages: state.messages
  };
}

function mapDispatchToProps(_) {
  return {};
}

export const Messages = connect(mapStateToProps, mapDispatchToProps)(messages);

export default Messages;
