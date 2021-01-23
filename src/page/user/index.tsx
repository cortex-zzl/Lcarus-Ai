import React, { useState } from 'react';
import { Tabs, Button, Progress, message } from 'antd';
import {Link} from 'react-router-dom'
import { Consumer } from '../../index';
import { EditOutlined } from '@ant-design/icons';
const json = require('./lan.json');
import './user.less';
import { Content } from 'antd/lib/layout/layout';
const { TabPane } = Tabs;
import { ListTypeshow, TradingList } from './tabsDom';
import { API } from '../../fetch/fetch.js';

declare const window: any;

// 下半部分列表内容
class Listshow extends React.Component {
  constructor(props: object) {
    super(props);
  }
  props: {
    addresss: string
  }
  render() {
    console.log('render');
    return (
      <Consumer>
        {(value) => (
            <div className="bottomBox">
              <div className="bottomContent">
                <Tabs defaultActiveKey="1">
                  {new Array(2,3,5,4).map((item,index) => (
                    <TabPane tab={json[value.lan][`list${item}`]} key={item}>
                      {
                        index < 3 && <ListTypeshow address={this.props.addresss}></ListTypeshow>
                      }
                      {
                        index == 3 && <TradingList address={this.props.addresss}></TradingList>
                      }
                    </TabPane>
                    ))
                  }
                </Tabs>
              </div>
            </div>
        )}
      </Consumer>
    );
    
  }
}

// 上半部分用户信息
class Info extends React.Component {
  constructor(props: any) {
    super(props);

    this.state = {
      user: {
        img: 'https://ss3.bdstatic.com/70cFv8Sh_Q1YnxGkpoWK1HF6hhy/it/u=2070453827,1163403148&fm=26&gp=0.jpg',
        name: '',
        address: '',
        introduce: ''
      }
    };
  }
  props: {
    userid: string;
  };
  componentDidMount() {
    const _this = this
    API.getuserInfo(this.props.userid)
    .then(res => {
      console.log(res)
      _this.setState({
        user: {
          img: this.state.user.img,
          ...res
        }
      })
    }).catch(res => {
      message.error('error')
      window.history.go(-1);
    })
  }
  state: {
    user: {
      img: string;
      name: string;
      address: string;
      introduce: string;
    };
  }
  render() {
    let is =  false
    if (window.ctxWeb3 && window.ctxWeb3.eth.defaultAccount && window.ctxWeb3.eth.defaultAccount == this.state.user.address){
      is = true
    }
    return (
      <Consumer>
        {  value => 
            <div className="userinfoBox">
              <div className="userinfo">
                <div className='userLeft'>
                  <div className= { is ? 'is imgbox' : 'imgbox'}>
                    <div className='shadowBox'></div>
                      <Link className='edit' to={`/userEdit`}>{json[value.lan].edit}</Link>
                    <img src={this.state.user.img}  alt=""/>
                  </div>
                  <Button>{json[value.lan].attention}</Button>
                </div>
                <div className='userRight'>
                  <h3>{this.state.user.name}</h3>
                  <p>{this.props.userid}
                    <EditOutlined  onClick = {() => {
                      const oInput = document.createElement('input');
                      oInput.value = this.state.user.address;
                      document.body.appendChild(oInput);
                      oInput.select();
                      const res = document.execCommand('copy');
                      document.body.removeChild(oInput);
                      res && message.success('操作成功');
                      !res && message.error('操作失败');
                    }} />
                  </p>
                  <div className='dis'>{this.state.user.introduce}</div>
                </div>
              <div className='clear'></div>
              <div className='fansBox'>
                <div className='fans'>
                  <span>
                    {json[value.lan].attention}
                  </span>
                  <span>
                    {Math.ceil(Math.random() * 10000)}
                  </span>
                </div>
                <div className='fans'>
                  <span>
                    {json[value.lan].list7}
                  </span>
                  <span>
                    {Math.ceil(Math.random() * 10000)}
                  </span>
                </div>
              </div>
              </div>
          </div>
        }
      </Consumer>
    );
  }
}

export class User extends React.Component {
  constructor(props:any) {
    super(props)
  }
  props:any
  render (){
    return (
      <div id="User">
        <Info key={this.props.match.params.userid} userid={this.props.match.params.userid}></Info>
        <Listshow addresss={this.props.match.params.userid}></Listshow>
      </div>
    );
  }
  
}
