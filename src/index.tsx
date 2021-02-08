import React from 'react';
import ReactDOM from 'react-dom';

import { HashRouter as Router, Route, Switch } from 'react-router-dom';
import { uninstall, unlogin } from './notice/notice';


const obj = {
  lan: 'zn',
  ChangeLan: (value) => {
    obj.lan = value;
  },
  hasLoginWallet: false,
  address: ''
};
// 这里要先export ThemeContext才行，下面的组件用得着
export const ThemeContext = React.createContext(obj);

import { HEADC } from './component/head/head';
import {NoPerDom} from './routeconfig'
import './index.less';

declare const window: any;
window.localStorage.language = window.localStorage.language || 'zn'



import 'antd/dist/antd.css';
class APP extends React.Component {
  constructor(props: any) {
    super(props);

    this.state = {
      lan: localStorage.language || 'zn',
      ChangeLan: (value) => {
        // 切换语言过场动画
        document.querySelector('body').style.opacity = '0';
        setTimeout(() => {
          this.setState((state) => {
            window.localStorage.language = value;
            return { lan: value };
          });
        }, 1000);
        setTimeout(() => {
          document.querySelector('body').style.opacity = '1';
        }, 1500);
      },
      // hasLoginWallet: window.ctxWeb3 && window.ctxWeb3.eth.defaultAccount
      hasLoginWallet: false,
      address: ''
    };
  }
  state: {
    lan: 'zn',
    ChangeLan: any,
    hasLoginWallet: boolean,
    address: string
  }
  componentDidMount(){
    const _this = this
    // 轮询检测钱包状态
    // window.walletLogin = setInterval( () => {
    //   if (window.ctxWeb3 && window.ctxWeb3.eth.defaultAccount) {
    //     if(!_this.state.hasLoginWallet)  _this.setState({hasLoginWallet: true, address: window.ctxWeb3.eth.defaultAccount})
    //   } else {
    //     if (_this.state.hasLoginWallet) _this.setState({hasLoginWallet: false})
    //   }
    // } , 500)
    async function getwallet() {
      if (window.ethereum) {
        const addresss = await window.ethereum.request({ method: 'eth_accounts' })
        if(!_this.state.hasLoginWallet && addresss[0]) _this.setState({hasLoginWallet: true , address: addresss[0]})
      } else {
        if (_this.state.hasLoginWallet) _this.setState({hasLoginWallet: false, address: ''})
      }
    }
    // 检测钱包相关信息,钱包初始化需要时间
    // setTimeout(() => {
    //   if (!window.ethereum) {
    //     uninstall();
    //     return;
    //   }
      // if (!window.ctxWeb3.eth.defaultAccount) {
      //   unlogin();
      //   return;
      // }
    // }, 1000)
     window.walletLogin = setInterval( getwallet, 500)
  }
  componentWillUnmount() {
    clearInterval(window.walletLogin)
  }
  render() {
    const {whiteRoutes, perRoutes} =  require('./routeconfig')
    return (
      <div id="app">
        <ThemeContext.Provider value={this.state}>
          <Router>
            <HEADC></HEADC>
            <Switch>
              {
                whiteRoutes.map(item => (
                  <Route path={item.path} component={item.component} key={item.name} exact/>
                ))
              }
              {
                perRoutes.map(item => (
                  <Route path={item.path} component={this.state.hasLoginWallet ? item.component : NoPerDom} key={item.name} exact/>
                ))
              }
            </Switch>
          </Router>
        </ThemeContext.Provider>
      </div>
    );
  }
}
// 确保在渲染页面时，ctxWeb3（钱包）已经初始化完毕
window.onload = () => {
  ReactDOM.render(<APP />, document.getElementById('root'));
}
