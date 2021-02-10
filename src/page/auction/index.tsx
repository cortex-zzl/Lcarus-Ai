import React, { useState } from 'react';
import { InputNumber, Tooltip, message, Table, Button, Spin, Modal } from 'antd';
import {  EyeOutlined, HeartOutlined , SyncOutlined} from '@ant-design/icons';
const json = require('./lan.json');
import { ThemeContext } from '../../index';
import { Link } from 'react-router-dom';
import {API, uploadAvatar, walletSign, getRecoverid} from '../../fetch/fetch'
import {ipfsAdd, ipfsGet} from '../../fetch/ipfs.js'
import moment from 'moment';
import { web3Object } from '../../interface/contract.js'
import './auction.less'
declare const window: any;

function getday(s:number) {
  const day = Math.floor(s / (1000 * 60 * 60 * 24))
  return day > 9 ? day : '0' + day
}
function geth(s:number) {
  const day = Math.floor(s / (1000 * 60 * 60))
  return day > 9 ? day : '0' + day
}
function getm(s:number) {
  const day = Math.floor(s / (1000 * 60))
  return day > 9 ? day : '0' + day
}
function gets(s:number) {
  const day = Math.floor(s / 1000)
  return day > 9 ? day : '0' + day
}


export  class Auction extends React.Component {
  static contextType = ThemeContext;
  constructor(props:any) {
    super(props)
    this.getArtDataFromIpfs = this.getArtDataFromIpfs.bind(this)
    this.state = {
      loading: true,
      info: {
        creator: {
          name: '',
          img: '',
          address: ''
        },
        hasor: {
          name: '',
          img: '',
          address: ''
        },
        like: 0,
        look: 0,
        name: '',
        canvas: {
          token: '',
          img: ''
        },
        tokenId: '',
        startPrice: 0,
        price: 0,
        countTime: 0,
        createTime: '',
        EXIFinfo: '',
        describe: '',
        details: '',
        imgUrl: '',
        auction: 0, //，1拍卖中，2即将拍卖，3：售卖（一口价的物品， 4：不卖的物品
        imgType: 0, //1主画布， 2图层
      },
      auctionRecord: [],
      layers: [],
      layerStates: [],
      isModalVisible:false,
      offerPrice: 0,
      exists: false // 拍卖的最后一次出价是否是当前用户，
    }
    this.getLayers = this.getLayers.bind(this)
    this.handleOk = this.handleOk.bind(this)
    this.layerStates = this.layerStates.bind(this)
    this.timeGetPrice = this.timeGetPrice.bind(this)
    this.timeCount = this.timeCount.bind(this)
    this.getAuctionRecord = this.getAuctionRecord.bind(this)
  }
  state: {
    info: {// 画布或者图层信息
      creator: {
        name: string,
        img: string,
        address: string
      },
      hasor: {
        name: string,
        img: string,
        address: string
      },
      like: number,
      look: number,
      name: string,
      canvas: {
        token: string,
        img: string
      },
      tokenId:string,
      startPrice: number,
      price: number,
      countTime: number,
      createTime: string,
      EXIFinfo: string,
      describe: string,
      details: string,
      imgUrl: string,
      auction: number, //，1拍卖中，2即将拍卖，3：售卖（一口价的物品， 4：不卖的物品
      imgType: number, //1主画布， 2图层
    },
    auctionRecord: Array<{
      name: string,
      address: string,
      price: number,
      time: any
    }>,
    layers: Array<{
      name: string,
      address: string,
      list: Array<any>
    }>,
    layerStates: Array<string>,
    loading: boolean,
    exists: boolean,
    offerPrice: number,
    isModalVisible: boolean // 出价弹窗
  }
  offer(messages){
    if (!this.context.address) {
      message.error(messages)
      return
    }
    if (this.state.info.auction == 1) {
      this.setState({isModalVisible: true, offerPrice: Math.max(this.state.info.price + 1, this.state.info.startPrice)})
    }
    if (this.state.info.auction == 3) {
      web3Object.managerContract.methods.takeBuyPrice(this.state.info.tokenId, -1).send({
        from: this.context.address,
        value: this.state.info.price * window.defaultUnit
      })
      .then(res => message.success('success'))
      .catch(err => message.error('error'))
    }
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
  // 路由参数变化
  componentWillReceiveProps(newProps) {
    this.getInfo(newProps)
  }
  async getLayers(layers){
    // 获取画布下属所有图层
    for (let i = 0; i < layers.length; i ++) {
      const imgContent = await ipfsGet(layers[i].list[0])
      layers[i].list[0] = imgContent[0].content.toString()
    }
    this.setState({layers: layers})
  }
  async layerStates(list){
    // 获取图层所有状态
    for (let i = 0; i < list.length; i ++) {
      const imgContent = await ipfsGet(list[i])
      list[i] = imgContent[0].content.toString()
    }
    this.setState({layerStates: list})

  }
  // 每过3秒拿一次最高出价
  timeGetPrice(token) {
    clearInterval(window.getPriceH)
    let _this = this
    timeGetPriceFn()
    window.getPriceH =  setInterval(timeGetPriceFn, 3000)
    function timeGetPriceFn() {
      web3Object.managerContract.methods.pendingBids(token).call({from: window.publicAddress, gas: 1000000})
      .then(res => {
        _this.setState({info: {..._this.state.info, price: res.amount},exists : res.bidder == _this.context.address})
      })
    }
  }
  // 更新倒计时
  timeCount () {
    clearInterval(window.timeCount)
    let _this = this
    window.timeCount = setInterval(() => {
      if (_this.state.info.auction == 1 || _this.state.info.auction == 2) {
        const time = this.state.info.countTime - 1000
        if (time < 0) {
          window.location.reload()
        }
        else {
          _this.setState({
            info: {..._this.state.info, countTime: time}
          })
        }
      }

    }, 1000)
  }
  // 确认交易
  acceptBid() {
    web3Object.managerContract.methods.acceptBid(this.state.info.tokenId).send({from: this.context.address})
    .then(res => message.success('success'))
    .catch(err => message.error('error'))
  }
  componentWillUnmount() {
    clearInterval(window.getPriceH)
    clearInterval(window.timeCount)
  }
  // 获取最新的出价记录
  getAuctionRecord() {
    // 获取拍卖纪录
    web3Object.managerContract.getPastEvents("BidProposed", {
      fromBlock: 	3250400,
    }).then(res => {
      res = res.filter(item => item.returnValues.tokenId == this.state.info.tokenId)
      this.setState({
        auctionRecord: res.slice(res.length - 5, res.length).map(todo => {
          return {
            address: todo.returnValues.bidder,
            price:  todo.returnValues.bidAmount + ' CTXC',
            time: 'Just now'
          }
        })
      })
    })
  }
  // 用户确认出价
  handleOk () {
    web3Object.managerContract.methods.bid(this.state.info.tokenId).send({from: this.context.address, value: this.state.offerPrice * window.defaultUnit})
    .then(res => message.success('success'))
    .catch(err => message.error('error'))
  }
  componentDidMount() {
    this.getInfo(this.props)
  }
  props: any
  async getInfo(props){
    const data = await this.getArtDataFromIpfs(props.match.params.token)
    if(data.resSS) {
      message.error('error')
      return
    }
    if (data.list && data.list[0].length > 0) {
      const imgContent = await ipfsGet(data.list[0])
      data.imgUrl = imgContent[0].content.toString()
    }
    // 获取画布/图层信息
    const type = data.layers && data.layers.length > 0 ? 1 : 2
    const deteNow = moment().unix()
    const infoC = {
      creator: {
        img: data.artistImgUrl,
        name: data.artistInfo.name,
        address: data.artistAddress
      },
      hasor: {
        name: data.hasInfo.name,
        img: data.hasImgUrl,
        address: data.hasAddress
      },
      like: Math.ceil (Math.random() * 1000),
      look:  Math.ceil (Math.random() * 1000),
      name: data.canvasName || data.name,
      canvas: {
        token: data.canvasTokenId || 1,
        img: window.defaultImg 
      },
      startPrice: data.reservePrice,
      price: data.buyPrice,
      countTime: deteNow > data.auctionStartTime ? (data.auctionEndTime - deteNow) * 1000 : (deteNow - data.auctionStartTime) * 1000 ,
      details: '这是一段详细信息xxxxxxxxxxxxxxxxxxxxxx',
      describe: data.introduce,
      createTime: data.creatTime,
      tokenId: props.match.params.token,
      EXIFinfo: '不知道这里应该放什么',
      imgUrl: type == 1 ? window.defaultImg  : data.imgUrl,
      // auction: 1,
      auction:  data.reservePrice != '0' ? (deteNow > data.auctionStartTime ? '1' : '2') : (data.buyPrice == '0' ? '4' : '3'), //，1拍卖中，2即将拍卖，3：售卖（一口价的物品， 4：不卖的物品 5拍卖结束
      imgType: type, //1主画布， 2图层
    }
    
    if (data.reservePrice != '0' && deteNow > data.auctionEndTime) {
      infoC.auction = '5'
    }
    this.setState({
      info: infoC
    })
    console.log(data)
    // 拍卖状态则，每过几秒去拿一次当前最高出价
    this.state.info.auction == 1 && this.timeGetPrice(data.tokenId);
    // 拍卖或者等待拍卖的倒计时
    (this.state.info.auction == 1 || this.state.info.auction == 2) && this.timeCount()
    this.setState({loading: false})
    this.state.info.imgType == 1 && this.getLayers(data.layers)
    this.state.info.imgType == 2 && this.layerStates(data.list)
    this.state.info.auction == 1 && this.getAuctionRecord()
  }
  render() {
    const columns = [
      {
        dataIndex: 'address',
        key: 'price',
      },
      {
        dataIndex: 'price',
        key: 'price',
      },
      {
        dataIndex: 'time',
        key: 'price',
      },
    ];
    return (
      <ThemeContext.Consumer>
        {
          value => (
            
            <Spin spinning={this.state.loading}>
              <div id='auction'>
                <div className='info flex'>
                  <div className='left imgAndInfo'>
                    <div className='left flex'>
                      <div className='userInfoBox'>
                        <div className='userInfo'>
                          <h2 className='canvasName'>
                            {this.state.info.name}
                          </h2>
                          <div className='user flex'>
                            <Link to={`/user/${this.state.info.creator.address}`}>
                              <img src={this.state.info.creator.img} alt=""/>
                            </Link>
                            <div>
                              <p>{json[value.lan].artist}</p>
                              <h3>{this.state.info.creator.name}</h3>
                            </div>
                          </div>
                          <div className='user flex'>
                            <Link to={`/user/${this.state.info.hasor.address}`}>
                              <img src={this.state.info.hasor.img} alt=""/>
                            </Link>
                            <div>
                              <p>{json[value.lan].collector}</p>
                              <h3>{this.state.info.hasor.name}</h3>
                            </div>
                          </div>
                          <div className='look flex'>
                            <span>
                              <HeartOutlined /> {this.state.info.like}
                            </span>
                            <span>
                              <EyeOutlined /> {this.state.info.look}
                            </span>
                          </div>
                          {
                            (this.state.info.auction == 1 || this.state.info.auction == 5)&&
                            <div className='price price1'>
                              <h3 className='priceType'>{this.state.info.auction == 1 ? json[value.lan].inAuction : json[value.lan].outAuction}</h3>
                              <p>
                                {json[value.lan].startPrice}: 
                                <span className='priceNum'>{this.state.info.startPrice} <strong>CTXC</strong></span>
                              </p>
                              <p>
                                {json[value.lan].price}: 
                                <span className='priceNum'>{this.state.info.price}</span>
                              </p>
                              {
                                this.state.info.auction == 1 &&
                                <Button
                                  disabled={this.context.address && this.context.address.toUpperCase() == this.state.info.hasor.address.toUpperCase()}
                                  onClick={() => this.offer(json[value.lan].login)}>{json[value.lan].offer}
                                </Button>
                              }
                              {
                                this.state.info.auction == 5 && this.state.exists &&
                                <Button onClick={this.acceptBid}>{json[value.lan].confirmation}</Button>
                              }
                              <Modal title={json[value.lan].offer} visible={this.state.isModalVisible} onOk={this.handleOk} onCancel={() => this.setState({isModalVisible: false})}>
                                <InputNumber min={Math.max(this.state.info.price + 1, this.state.info.startPrice)} value={this.state.offerPrice} onChange={(v) => this.setState({offerPrice:v})}></InputNumber>&nbsp;&nbsp;&nbsp;<strong>CTXC</strong>
                              </Modal>
                            </div>
                          }

                          {
                            this.state.info.auction == 2 &&
                            <div className='price price2'>
                              <h3 className='priceType'>{json[value.lan].upcomingAuction}</h3>
                              <p>
                                {json[value.lan].startPrice}: 
                                <span className='priceNum'>{this.state.info.startPrice}</span>
                              </p>
                            </div>
                          }
                          {
                            this.state.info.auction == 3 &&
                            <div className='price price3'>
                              <h3 className='priceType'>{json[value.lan].fixedPrice}</h3>
                              <p>
                                {json[value.lan].price}: 
                                <span className='priceNum'>{this.state.info.price}</span>
                              </p>
                              <Button
                                disabled={this.context.address && this.context.address.toUpperCase() == this.state.info.hasor.address.toUpperCase()}
                                onClick={() => this.offer(json[value.lan].login)}>{json[value.lan].offer}
                              </Button>
                            </div>
                          }
                          {
                            this.state.info.auction == 4 &&
                            <div className='price price4'>
                              <h3 className='priceType'>{json[value.lan].Notsale}</h3>
                            </div>
                          }
                        </div>
                      </div>
                      <div className='imgShow'>
                        <img src={this.state.info.imgUrl} alt=""/>
                        {
                          (this.state.info.auction == 1 || this.state.info.auction == 2) &&
                          <p style = {{backgroundColor: ['#57b27a', '#eb973f'][this.state.info.auction - 1]}}>
                            {json[value.lan].countTime}:  &nbsp;
                            {getday(this.state.info.countTime)} 
                            {json[value.lan].day}  &nbsp;
                            {geth(this.state.info.countTime % (1000 * 60 * 60 * 24))}  
                            {json[value.lan].hour}  &nbsp;
                            {getm(this.state.info.countTime % (1000 * 60 * 60))}  
                            {json[value.lan].minutes}  &nbsp;
                            {gets(this.state.info.countTime % (1000 * 60))}  
                            {json[value.lan].seconds}
                          </p>
                        }
                      </div>
                    </div>
                      {
                        (this.state.info.auction == 1 || this.state.info.auction == 5) &&
                        <div  className='left-bottom auctionRecord'>
                          <h2>{json[value.lan].auctionRecord} <SyncOutlined onClick={this.getAuctionRecord} /></h2>
                          <Table size='small' dataSource={this.state.auctionRecord} columns={columns} />
                        </div>
                      }
                  </div>
                  <div className='right detailInfo'>
                    {
                      this.state.info.imgType == 2 && 
                    (
                      <div className='canvas'>
                        <h2>{json[value.lan].canvas}</h2>
                        <Link to={`/auction/${this.state.info.canvas.token}`}>
                          <img src={this.state.info.canvas.img} alt=""/>
                        </Link>
                      </div>
                    )
                    }
                    <h2>{json[value.lan].describe}</h2>
                    <div>{this.state.info.describe}</div>
                    <h2>{json[value.lan].details}</h2>
                    <div>{this.state.info.details}</div>
                    <h2>{json[value.lan].createTime}</h2>
                    <div>{this.state.info.createTime}</div>
                    <h2>{json[value.lan].EXIFinfo}</h2>
                    <div>{this.state.info.EXIFinfo}</div>
                  </div>
                </div>
                <div  className='layer'>
                  <h2>{this.state.info.imgType == 1 ? json[value.lan].layer : json[value.lan].states}</h2>
                  <div className='imgList'>
                    <div className='listBox'>
                      {
                        this.state.info.imgType == 1 &&
                        this.state.layers.map(item => (
                          <Tooltip title={item.name} key={Math.random()}>
                            <img key={Math.random()} src={item.list[0]} alt=""/>
                          </Tooltip>
                        ))
                      }
                      {
                        this.state.info.imgType == 2 &&
                        this.state.layerStates.map(item => (
                          <img key={new Date().getTime()} src={item} alt=""/>
                        ))
                      }
                    </div>
                  </div>
                </div>
              </div>
          
            </Spin>
            )
        }
      </ThemeContext.Consumer>
    )
  }
}