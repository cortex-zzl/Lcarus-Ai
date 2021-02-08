import React, { useState } from 'react';
import { Input, message, Popover } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { LanChance } from '../../page/home/component/languageChance';
import { ThemeContext } from '../../index'
const json = require('./lan.json');
import { Link } from 'react-router-dom';
import { UserOutlined } from '@ant-design/icons';
import {API} from '../../fetch/fetch'
import {ipfsAdd, ipfsGet} from '../../fetch/ipfs.js'
const  { web3Object } = require('../../interface/contract.js')


function HeadRight() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const showModal = () => {
    setIsModalVisible(!isModalVisible);
  };
  const onPressEnter = (value) => {
    message.info('该功能完善中');
    setIsModalVisible(false);
  };
  return (
    <ThemeContext.Consumer>
      {(value) => (
        <div className="headRight">
          <Link to="" className="homeLink">
            {json[value.lan].link0}
          </Link>
          <Link to="/gallery">{json[value.lan].link1}</Link>
          {/* <Link to="">{json[value.lan].link2}</Link>
          <Link to="">{json[value.lan].link3}</Link> */}
          <LanChance></LanChance>
          <SearchOutlined onClick={showModal}></SearchOutlined>
          <div className={`head-search ${isModalVisible && 'show'}`}>
            <Input
              onBlur={() => {
                setIsModalVisible(false);
              }}
              onPressEnter={onPressEnter}
            />
          </div>
        </div>
      )}
    </ThemeContext.Consumer>
  );
}

declare const window: any;
// 头像和hover显示的dom
export class GetUserInfoDom extends React.Component {
  static contextType = ThemeContext;
  constructor(props:any) {
    super(props)
    this.state = {
      userInfo: {},
      canCreatArt: false
    }
  }
  state: {
    userInfo: any,
    canCreatArt: boolean
  }
  async componentDidMount(){
    const _this = this
    this.setState({address: this.context.address}) 
    API.getuserInfo( this.context.address)
    .then(res => {
      _this.setState({
        userInfo: {
          ...res
        }
      })
      getImgUrl()
    })

    async function getImgUrl () {
      if (_this.state.userInfo.imgHash) {
        const imgConetent = await ipfsGet(_this.state.userInfo.imgHash)
        _this.setState ( {userInfo: {
          ..._this.state.userInfo,
          img: imgConetent[0].content.toString()
        }})
      }
    }
    web3Object.managerContract.methods.artistWhitelist(this.context.address).call({from:  this.context.address, gas:1000000})
    .then(res => {
      console.log('地址  :' + this.context.address)
      console.log('是否拥有艺术家权限：' + res)
      // 用户有没有创建艺术品的权限
      this.setState({canCreatArt: res})
    })
  }
  render(){
    const content = (
      <ThemeContext.Consumer>
        {value => (
          <div className='userPop'>
            <Link to={`/userEdit`}>{json[value.lan].edit}</Link>
            <Link to={`/user/${ this.context.address}`}>{json[value.lan].personal}</Link>
            {
              this.state.canCreatArt ? <Link to={`/createArt`}>{json[value.lan].creat}</Link>
              : <Link to={`/userEdit`}>申请艺术家的链接</Link>
            }
            <Link to={`/generateLayer`}>{json[value.lan].generate}</Link>
          </div>
        )}
      </ThemeContext.Consumer>
    )
    return (
      <ThemeContext.Consumer>
      {value => (
        <Popover  placement="bottomRight"
        title={`Hello ${this.state.userInfo.name || ( this.context.address &&  this.context.address.substring(0, 6) + '...')}`}
        content={content}>
          <img src={this.state.userInfo.img} alt=""/>              
        </Popover>
      )}
      </ThemeContext.Consumer>
    )
  }
} 

// 头部
export class HEADC extends React.Component {
  static contextType = ThemeContext;
  constructor(props: object) {
    super(props);
    this.onSearch = this.onSearch.bind(this);
  }
  onSearch(value: object) {
    console.log(value);
  }
  
  render() {
    return (
      <ThemeContext.Consumer>
        {
          (value) =>(
            <div id="head">
              <div className="head-content">
                <div className="head-logo">
                  <UserOutlined></UserOutlined>
                </div>
                <HeadRight></HeadRight>
              </div>
              {
                value.hasLoginWallet
                ?
                <div className='userImg'>
                  <GetUserInfoDom/>
                </div>
                : 
                <div className='nologin'>
                  {json[value.lan].nologged}
                </div>
              }
            </div>
        )}
      </ThemeContext.Consumer>
    );
  }
}
