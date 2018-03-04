// @flow

import * as React from 'react';
import { connect } from 'react-redux';
import AceEditor from 'react-ace';
import 'brace/mode/markdown';
import 'brace/mode/text';
import 'brace/theme/monokai';
import {
  type EditorState,
} from '../../reducers/editor';
import {
  ItemTypeMarkdown,
  ItemTypeText,
} from '../../common/metadata';
import {
  type Buffer,
} from '../../common/buffer';
import {
  bufferUpdated,
} from '../../actions/editor';
import FileHeader from './FileHeader';

type Props = {
  bufferUpdated: (Buffer, string) => void
} & EditorState;

class editor extends React.Component<Props> {
  editor: ?AceEditor;

  handleOnChange() {
    if (this.editor) {
      this.props.bufferUpdated(this.props.buffer, this.editor.getValue());
    }
  }

  handleOnLoad(editorElement) {
    this.editor = editorElement;
  }

  render() {
    let mode;
    switch (this.props.buffer.itemType) {
    case ItemTypeMarkdown: {
      mode = 'markdown';
      break;
    }
    case ItemTypeText: {
      mode = 'text';
      break;
    }
    default:
      mode = 'text';
    }

    const theme = 'monokai';

    let isEdited;
    if (this.editor) {
      isEdited = this.props.content === this.editor.getValue();
    } else {
      isEdited = false;
    }

    return (
      <div>
        <FileHeader
          buffer={this.props.buffer}
          tabID=""
          isEdited={isEdited}
        />
        <AceEditor
          value={this.props.content}
          mode={mode}
          theme={theme}
          name="aceEditor"
          width="100vw"
          height="100vh"
          focus
          showPrintMargin={false}
          wrapEnabled
          editorProps={{ $blockScrolling: true }}
          onChange={this.handleOnChange.bind(this)}
          onLoad={this.handleOnLoad.bind(this)}
        />
      </div>
    );
  }
}

const mapStateToProps = (state: {editor: EditorState}): EditorState => {
  return state.editor;
};


const mapDispatchToProps = (dispatch) => {
  return {
    bufferUpdated: (buffer: Buffer, content: string) => {
      dispatch(bufferUpdated(buffer, content));
    }
  };
};


export const Editor = connect(mapStateToProps, mapDispatchToProps)(editor);

export default Editor;
