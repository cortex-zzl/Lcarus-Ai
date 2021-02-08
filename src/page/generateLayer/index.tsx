import React, { useState } from 'react';
import { Input, Select, message, Form, Button, Checkbox } from 'antd';
const { Option } = Select;
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
const json = require('./lan.json');
import { ThemeContext } from '../../index';
import {API, uploadAvatar, walletSign} from '../../fetch/fetch'
import './generateLayer.less'
declare const window: any;

export  class generateLayer extends React.Component {
  constructor(props:any) {
    super(props)
    this.state = {
      model: '1',
      text: '',
      url: ''

    }
  }
  state: {
    model: string,
    text: string,
    url: string
  }
  render() {
    
    return (
      <ThemeContext.Consumer>
        {
          value => (
            <div id='generateLayer'>
              <div className='content'>
                <h1>
                  {json[value.lan].title}
                </h1>
                <Select defaultValue="1" style={{ width: 300 }} onChange={(value) => {this.setState({model: value})}}>
                  <Option value="1">{json[value.lan].model1}</Option>
                  <Option value="2">{json[value.lan].model2}</Option>
                </Select>
                <div className='text'>
                  <Input.TextArea rows={4} maxLength={25} placeholder={json[value.lan].dis} onChange={v => this.setState({text: v})}></Input.TextArea>
                  <Button disabled={this.state.text.length === 0}>{json[value.lan].generate}</Button>
                </div>
                <img src={this.state.url} alt=""/>
                <Button disabled={!this.state.url}>{json[value.lan].down}</Button>
              </div>
            </div>
          )
        }
      </ThemeContext.Consumer>
    )
  }
}