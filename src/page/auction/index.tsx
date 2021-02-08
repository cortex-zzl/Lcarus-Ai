import React, { useState } from 'react';
import { Input, Tooltip, message, Table, Button, Spin } from 'antd';
import {  EyeOutlined, HeartOutlined , SyncOutlined} from '@ant-design/icons';
const json = require('./lan.json');
import { ThemeContext } from '../../index';
import { Link } from 'react-router-dom';
import {API, uploadAvatar, walletSign, getRecoverid} from '../../fetch/fetch'
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
      layerStates: []
    }
    this.getLayers = this.getLayers.bind(this)
    this.layerStates = this.layerStates.bind(this)
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
    layerStates: Array<{
      name: string,
      url: string
    }>,
    loading: boolean
  }
  offer(message){
    if (!this.context.address) {
      message.error(message)
    }
  }
  // 路由参数变化
  componentWillReceiveProps(newProps) {
    this.getInfo()
  }
  getLayers(){
    // 获取画布下属所有图层
    this.setState({
      layers: [
        {
          name: '图层1',
          address: '213',
          list: [
            {
              name: '图层1的状态1',
              url: 'https://ss0.bdstatic.com/70cFvHSh_Q1YnxGkpoWK1HF6hhy/it/u=2537086134,167909826&fm=26&gp=0.jpg'
            },
            {
              name: '图层1的状态2',
              url: 'https://ss3.bdstatic.com/70cFv8Sh_Q1YnxGkpoWK1HF6hhy/it/u=3594230445,3232272358&fm=26&gp=0.jpg'
            },
          ]
        },
        {
          name: '图层2',
          address: '23',
          list: [
            {
              name: '图层2的状态1',
              url: 'https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fku.90sjimg.com%2Felement_origin_min_pic%2F17%2F03%2F28%2Fe9c9789ce5bca437f92036302a66784f.jpg&refer=http%3A%2F%2Fku.90sjimg.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=jpeg?sec=1613805776&t=93f59b0f38245878fd29a50c975ef9a4'
            },
            {
              name: '图层2的状态2',
              url: 'https://ss3.bdstatic.com/70cFv8Sh_Q1YnxGkpoWK1HF6hhy/it/u=2331904876,1915032323&fm=11&gp=0.jpg'
            },
          ]
        },
      ]
    })
  }
  layerStates(){
    // 获取图层所有状态、
    this.setState({
      layerStates: [
        {
          name: '状态1',
          url: 'https://ss0.bdstatic.com/70cFvHSh_Q1YnxGkpoWK1HF6hhy/it/u=2537086134,167909826&fm=26&gp=0.jpg'
        },
        {
          name: '状态2',
          url: 'https://ss3.bdstatic.com/70cFv8Sh_Q1YnxGkpoWK1HF6hhy/it/u=3594230445,3232272358&fm=26&gp=0.jpg'
        },
        {
          name: '状态2',
          url: 'https://ss3.bdstatic.com/70cFv8Sh_Q1YnxGkpoWK1HF6hhy/it/u=3594230445,3232272358&fm=26&gp=0.jpg'
        },
        {
          name: '状态2',
          url: 'https://ss3.bdstatic.com/70cFv8Sh_Q1YnxGkpoWK1HF6hhy/it/u=3594230445,3232272358&fm=26&gp=0.jpg'
        },
        {
          name: '状态2',
          url: 'https://ss3.bdstatic.com/70cFv8Sh_Q1YnxGkpoWK1HF6hhy/it/u=3594230445,3232272358&fm=26&gp=0.jpg'
        },
        {
          name: '状态2',
          url: 'https://ss3.bdstatic.com/70cFv8Sh_Q1YnxGkpoWK1HF6hhy/it/u=3594230445,3232272358&fm=26&gp=0.jpg'
        },
      ]
    })
  }
  getAuctionRecord() {
    // 获取拍卖纪录
    this.setState({
      auctionRecord: [1,2.3,4,5].map(item => {
        return {
          name: '一个用户名称',
          address: '0xxxxxxxxxxxxxxxxxxxxxxx' + Math.ceil(Math.random() * 10000),
          price: Math.ceil(Math.random() * 10000) + 'CTXC',
          time: '20:20:00'
        }
      })
    })
  }
  props: any
  getInfo(){
    console.log(this.props.match.params.token)
    // 获取画布/图层信息
    setTimeout(() => {
      const type = Math.ceil (Math.random() * 2)
      this.setState({
        info: {
          creator: {
            img: 'https://ss3.bdstatic.com/70cFv8Sh_Q1YnxGkpoWK1HF6hhy/it/u=2070453827,1163403148&fm=26&gp=0.jpg',
            name: '创建者xxx',
          },
          hasor: {
            name: '拥有者xxx',
            img: 'https://ss3.bdstatic.com/70cFv8Sh_Q1YnxGkpoWK1HF6hhy/it/u=2070453827,1163403148&fm=26&gp=0.jpg'
          },
          like: Math.ceil (Math.random() * 1000),
          look:  Math.ceil (Math.random() * 1000),
          name: type  == 1 ? '画布名称' : '图层名称',
          canvas: {
            token: 'xxxxxxx',
            img: 'https://ss0.bdstatic.com/70cFvHSh_Q1YnxGkpoWK1HF6hhy/it/u=1896238784,1495930168&fm=26&gp=0.jpg'
          },
          startPrice: 100,
          price: 120,
          countTime: 126400000,
          details: '这是一段详细信息xxxxxxxxxxxxxxxxxxxxxx',
          describe: '这是一段介绍xxxxxxxxxxxxxxxxxxxxxx',
          createTime: '126400000',
          EXIFinfo: '126400000',
          imgUrl: 'https://ss0.bdstatic.com/70cFvHSh_Q1YnxGkpoWK1HF6hhy/it/u=1896238784,1495930168&fm=26&gp=0.jpg',
          // auction: 1,
          auction: Math.ceil (Math.random() * 4), //，1拍卖中，2即将拍卖，3：售卖（一口价的物品， 4：不卖的物品
          imgType: type, //1主画布， 2图层
        }
      })
      this.setState({loading: false})
      this.state.info.imgType == 1 && this.getLayers()
      this.state.info.imgType == 2 && this.layerStates()
      this.state.info.auction == 1 && this.getAuctionRecord()
    }, 200)
  }
  componentDidMount(){
    this.getInfo()
  }
  render() {
    const columns = [
      {
        dataIndex: 'name',
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
                              <p>{json[value.lan].artist}</p>
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
                            this.state.info.auction == 1 &&
                            <div className='price price1'>
                              <h3 className='priceType'>{json[value.lan].inAuction}</h3>
                              <p>
                                {json[value.lan].startPrice}: 
                                <span className='priceNum'>{this.state.info.startPrice}</span>
                              </p>
                              <p>
                                {json[value.lan].price}: 
                                <span className='priceNum'>{this.state.info.price}</span>
                              </p>
                              <Button onClick={() => this.offer(json[value.lan].login)}>{json[value.lan].offer}</Button>
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
                              <Button onClick={() => this.offer(json[value.lan].login)}>{json[value.lan].offer}</Button>
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
                          (this.state.info.auction === 1 || this.state.info.auction === 2) &&
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
                        this.state.info.auction === 1 &&
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
                        <Link to={`/canvasShow/${this.state.info.canvas.token}`}>
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
                          <Tooltip title="该图层的名字，点击会跳转到该图层的拍卖界面" key={Math.random()}>
                            <Link to={`/auction/${item.address}`}>
                              <img key={item.name} src={item.list[0].url} alt=""/>
                            </Link>
                          </Tooltip>
                        ))
                      }
                      {
                        this.state.info.imgType == 2 &&
                        this.state.layerStates.map(item => (
                          <Tooltip title="该状态的名字"  key={Math.random()}>
                            <img key={item.name} src={item.url} alt=""/>
                          </Tooltip>
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