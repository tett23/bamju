// @flow

import Message from '../../app/common/message';

describe('Message', () => {
  it('create', () => {
    const mes = Message.create(Message.MessageTypeInfo, 'hogehoge');

    expect(mes).toMatchObject({
      type: Message.MessageTypeInfo,
      message: 'hogehoge',
    });
    // $FlowFixMe
    expect(mes.stack.length).toBe(1);
    // $FlowFixMe
    expect(mes.stack[0]).toMatch(/message/);
  });

  it('wrap', () => {
    const mes = Message.wrap('foo', Message.create(Message.MessageTypeInfo, 'bar'));

    expect(mes).toMatchObject({
      type: Message.MessageTypeInfo,
      message: 'foo. bar',
    });
    // $FlowFixMe
    expect(mes.stack.length).toBe(2);
    // $FlowFixMe
    expect(mes.stack[0]).toMatch(/message/);
    // $FlowFixMe
    expect(mes.stack[1]).toMatch(/message/);
  });
});
