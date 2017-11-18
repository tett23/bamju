// @flow

import React from 'react';
import { Breadcrumb } from 'react-bootstrap';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import type { mainViewState } from '../reducers/main_view';
import type { Buffer } from '../../common/project';

const tab = ({ name, path, body }) => {
  console.log('refresh tab', body);

  const breadcrumbItems = [];
  path.split('/').forEach((item: string) => {
    if (item === '') {
      return;
    }

    breadcrumbItems.push(<Breadcrumb.Item key={item}>{item}</Breadcrumb.Item>);
  });

  const html = {
    __html: body
  };

  return (
    <div>
      <Breadcrumb>{breadcrumbItems}</Breadcrumb>
      <div name={name} dangerouslySetInnerHTML={html} />
    </div>
  );
};

tab.defaultProps = {
  name: '',
  path: '',
  body: ''
};

tab.propTypes = {
  name: PropTypes.string,
  path: PropTypes.string,
  body: PropTypes.string
};

const mapStateToProps = (state: {mainView: mainViewState}) => {
  console.log('Tab mapStateToProps', state);
  const t:?Buffer = state.mainView.browser.tabs[0];

  return t || tab.defaultProps;
};


const mapDispatchToProps = (dispatch) => {
  console.log('Tab mapDispatchToProps', dispatch);

  return {};
};


const Tab = connect(mapStateToProps, mapDispatchToProps)(tab);

export default Tab;
