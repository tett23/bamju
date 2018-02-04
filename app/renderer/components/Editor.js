// @flow

import * as React from 'react';
import { connect } from 'react-redux';
import 'brace/mode/markdown';
import 'brace/mode/text';
import 'brace/theme/monokai';
import AceEditor from 'react-ace';
import type { EditorState } from '../reducers/editor';
import {
  ItemTypeMarkdown,
  ItemTypeText,
} from '../../common/project';

type Props = {

} & EditorState;

class editor extends React.Component<Props> {
  editor: ?AceEditor;

  handleOnChange() {
  }

  handleOnLoad(editorElement) {
    this.editor = editorElement;
  }

  render() {
    console.log('refresh editor', this.props);

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

    return (
      <div>
        <AceEditor
          value={this.props.buffer.body}
          mode={mode}
          theme={theme}
          name="aceEditor"
          width="100vw"
          height="100vh"
          focus
          showPrintMargin={false}
          editorProps={{ $blockScrolling: true }}
          onChange={this.handleOnChange.bind(this)}
          onLoad={this.handleOnLoad.bind(this)}
        />
      </div>
    );
  }
}

const mapStateToProps = (state: {editor: EditorState}): EditorState => {
  console.log('Editor mapStateToProps', state);
  return state.editor;
};


const mapDispatchToProps = (dispatch) => {
  console.log('Editor mapDispatchToProps', dispatch);

  return {};
};


const Editor = connect(mapStateToProps, mapDispatchToProps)(editor);

export default Editor;
