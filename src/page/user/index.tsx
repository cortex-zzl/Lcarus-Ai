import React, { useState } from 'react';
import { Tabs, Button, Spin, message } from 'antd';
import {Link} from 'react-router-dom'
import { ThemeContext } from '../../index';
import { EditOutlined } from '@ant-design/icons';
const json = require('./lan.json');
import './user.less';
import { Content } from 'antd/lib/layout/layout';
const { TabPane } = Tabs;
import { ListTypeshow, TradingList } from './tabsDom';
import { API } from '../../fetch/fetch.js';
import {ipfsAdd, ipfsGet} from '../../fetch/ipfs.js'
import moment from 'moment';
import { web3Object } from '../../interface/contract.js'
// 默认的画布图片
const MockImg = window.defaultImg 
declare const window: any;

// 下半部分列表内容
class Listshow extends React.Component {
  static contextType = ThemeContext;
  constructor(props: object) {
    super(props);
    this.getArtList = this.getArtList.bind(this);
    this.tabChange = this.tabChange.bind(this);
    this.getArtDataFromIpfs = this.getArtDataFromIpfs.bind(this);
    this.state = {
      publicAddress: window.publicAddress, // 这个页面不需要登录，但是合约需要地址
      allList: [],
      useList: [], // 传给下方列表组件展示的数据
      ownList: [], // 我的收藏品列表
      creatList: [], // 我创建的艺术品列表
      loading: false,
      reacordList : [] // 用户交易记录
    }
  }
  props: {
    address: string,
  }
  state: {
    publicAddress: string,
    allList: Array<any>,
    useList: Array<any>,
    loading: boolean,
    ownList: Array<any>,
    creatList: Array<any>,
    reacordList : Array<any>,
  }
  componentDidMount() {
    this.getArtList()
    let _this = this
    web3Object.managerContract.getPastEvents("Transfer", {
      fromBlock: 	3250400,
      filter: {from: this.props.address}
    }).then(res => {
      _this.setState({reacordList: res.map(item => {
        return {
          name: '',
          price: item.price,
          time: null,
          tx: item.transactionHash,
          from: item.returnValues.from,
          to: item.returnValues.to
        }
      })})
      // res = res.filter(item => item.returnValues.tokenId == this.state.info.tokenId)
      // this.setState({
      //   auctionRecord: res.slice(res.length - 5, res.length).map(todo => {
      //     return {
      //       address: todo.returnValues.bidder,
      //       price:  todo.returnValues.bidAmount + ' CTXC',
      //       time: 'Just now'
      //     }
      //   })
      // })
    })
  }
  async getArtDataFromIpfs(token) {
    try {
      const hash = await web3Object.managerContract.methods.tokenURI(token).call({from: window.publicAddress, gas: 1000000})
      const price = await web3Object.managerContract.methods.sellingState(token).call({from: window.publicAddress, gas: 1000000})
      const hasAddress = await web3Object.managerContract.methods.ownerOf(token).call({from: window.publicAddress, gas: 1000000})
      const hasInfo = await API.getuserInfo(hasAddress)
      // 设置默认头像
      price.hasImgUrl = price.artistImgUrl =window.defaultImgT
      if (hasInfo.imgHash) {
        const hasImgUrl = await ipfsGet(hasInfo.imgHash)
        price.hasImgUrl = hasImgUrl[0].content.toString()
      }
      const artistAddress = await web3Object.managerContract.methods.uniqueTokenCreators(token, 0).call({from: window.publicAddress, gas: 1000000})
      const artistInfo = await API.getuserInfo(artistAddress)

      if (artistInfo.imgHash) {
        const artistImgUrl = await ipfsGet(artistInfo.imgHash)
        price.artistImgUrl = artistImgUrl[0].content.toString()
      }
      price.tokenId = token
      price.hasAddress = hasAddress
      price.artistAddress = artistAddress
      price.hasInfo = hasInfo
      price.artistInfo = artistInfo
      let content = await ipfsGet(hash)
      content = JSON.parse(content[0].content.toString())
      return Object.assign(content, price)
    } catch (error){
      console.log(error)
      return { 
        resSS: 'error'
      }
    }
    
  }
  // 初次加载所有的艺术品信息，没错，没有分页。。。
  async getArtList() {
    this.setState({loading: true})
    let lastToken = await web3Object.managerContract.methods.expectedTokenSupply().call({from: this.state.publicAddress, gas: 1000000})
    // lastToken是最后的艺术品token，因为token是从小到大分配的
    let list =  []
    for (let i = 0; i < parseInt(lastToken); i++) {
      list[i] = i + 1
    }
    let layers = [] 
    for (let i = 0; i < list.length; i ++) {
      const token = list[i]
      // 拿到所有的画布列表
      layers[i] = await this.getArtDataFromIpfs(token)
      // 如果是layer，从ipfs拿图片地址
      if (layers[i].list && layers[i].list.length > 0) {
        let content = await ipfsGet(layers[i].list[0])
        content = content[0].content.toString()
        layers[i].list[0] = content
      }
    }
    // 有些token可能申请了，但是没用铸币，是空的，筛选掉
    layers = layers.filter(item=> item.resSS != 'error')
  
    const deteNow = moment().unix()
    const res = layers.map(item => {
      return {
        imgType: item.layers ? -1 : -2, //-1画布  -2 图层
        img : item.layers ? MockImg : item.list[0],
        name: item.canvasName || item.name,
        priceType: item.reservePrice != '0' ? '2' : '1',
        auction: item.reservePrice != '0' ? (deteNow > item.auctionStartTime ? '1' : '2') : (item.buyPrice == '0' ? '4' : '3'),
        countdown: deteNow > item.auctionStartTime ? (item.auctionEndTime - deteNow) * 1000 : (deteNow - item.auctionStartTime) * 1000 ,
        price: (item.reservePrice != '0' ?  item.reservePrice : item.buyPrice) + ' CTXC',
        token: item.tokenId,
        hasAddress: item.hasAddress,
        artistAddress: item.artistAddress,
        hasImgUrl: item.hasImgUrl,
        artistImgUrl: item.artistImgUrl,
        // 以后做
        collection: false,
        look: '125',
      }
    })
    // 默认展示我的收藏品列表
    const listS = res.filter(item => 
      item.hasAddress.toUpperCase() == this.props.address.toUpperCase()
    )
    this.setState(
      {
        allList: res,
        useList: listS,
        ownList: listS,
        loading: false
      }
    )
    // 异步计算其他列表
    setTimeout(() => {
      const list = this.state.allList.filter(item => 
        item.artistAddress.toUpperCase() == this.props.address.toUpperCase()
      )
      this.state.creatList = list
    },1)
    
  }
  tabChange(key) {
    console.log(key)
    if (key == 2) {
      this.setState({
        useList: this.state.ownList
      })
    }
    if (key == 3) {
      this.setState({
        useList: this.state.creatList
      })
    }
  }
  render() {
    return (
      <ThemeContext.Consumer>
        {(value) => (
            <div className="bottomBox">
              <div className="bottomContent">
                <Spin spinning={this.state.loading}>
                  <Tabs defaultActiveKey="1" onChange= {this.tabChange}>
                    {new Array(2,3,5,4).map((item,index) => (
                        <TabPane tab={json[value.lan][`list${item}`]} key={item}>
                          {
                            index < 3 && <ListTypeshow key={this.state.useList.length} useList = {this.state.useList}></ListTypeshow>
                          }
                          {
                            index == 3 && <TradingList reacordList={this.state.reacordList}></TradingList>
                          }
                        </TabPane>

                      ))
                    }
                  </Tabs>
                </Spin>
              </div>
            </div>
        )}
      </ThemeContext.Consumer>
    );
    
  }
}

// 上半部分用户信息
class Info extends React.Component {
  static contextType = ThemeContext;
  constructor(props: any) {
    super(props);

    this.state = {
      user: {
        img: window.defaultImgT,
        name: '',
        address: '',
        introduce: '',
        imgHash: ''
      }
    };
  }
  state: {
    user: {
      img: string,
      name: string,
      address: string,
      introduce: string,
      imgHash: string
    }
  }
  props: {
    userid: string;
  };
  
  componentDidMount() {
    const _this = this
    API.getuserInfo(this.props.userid)
    .then(res => {
      _this.setState({
        user: {
          img: this.state.user.img,
          ...res
        }
      })
      getImgUrl()
    }).catch(res => {
      message.error('error')
      window.history.go(-1);
    })
    async function getImgUrl () {
      if (_this.state.user.imgHash) {
        const imgConetent = await ipfsGet(_this.state.user.imgHash)
        _this.setState ( {user: {
          ..._this.state.user,
          img: imgConetent[0].content.toString()
        }})
      }
    }
  }


  render() {
    let is =  false
    if (this.context.address && this.context.address.toUpperCase() == this.props.userid.toUpperCase()){
      is = true
    }
    return (
      <ThemeContext.Consumer>
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
      </ThemeContext.Consumer>
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
        <Info  userid={this.props.match.params.userid}></Info>
        <Listshow  address={this.props.match.params.userid}></Listshow>
      </div>
    );
  }
  
}
