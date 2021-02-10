import React, { useState } from 'react';
import {  Button, Menu, Dropdown, Pagination, Spin } from 'antd';
import { ThemeContext } from '../../index';
import { EditOutlined, DownOutlined, HeartOutlined } from '@ant-design/icons';
const json = require('./lan.json');
import { Link } from 'react-router-dom';
import { web3Object } from '../../interface/contract.js'
import {ipfsGet} from '../../fetch/ipfs.js'
import './gallery.less';
import moment from 'moment';
import { API } from '../../fetch/fetch.js';

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
declare const window: any;
const MockImg = window.defaultImg 

class Listshow extends React.Component {
  static contextType = ThemeContext;
  constructor(props: object) {
    super(props);
    this.getArtList = this.getArtList.bind(this);
    this.sortClick = this.sortClick.bind(this);
    this.setTypeList = this.setTypeList.bind(this);
    this.onChange = this.onChange.bind(this);
    this.state = {
      auction: 0, // 0:全部，1拍卖中，2即将拍卖，3：售卖（一口价的物品， 4：不卖的物品
      imgType: 0, // 0: 全部， -1主画布， -2图层
      collation: 0, // 搜索结果排序规则
      list: [],
      total: 1,
      sort: '',
      allList: [], // 所有的艺术品
      typeList: [], // allList按照当前筛选条件筛选的所有艺术品，主要是分页保存数据用
      loading: false,
      current: 1,
      publicAddress: window.publicAddress // 这个页面不需要登录，但是合约需要地址
    }
  }
  componentDidMount(){
    this.getArtList()
  }
  state: {
    auction: number,
    imgType: number,
    collation: number, // 搜索结果排序规则
    list: Array<any>,
    total: number,
    sort:string,
    loading: boolean,
    publicAddress: string,
    allList: Array<any>,
    typeList: Array<any>,
    current: number,
  }
  onChange (pageNumber) {
    this.setState(
      {
        list: this.state.typeList.slice((pageNumber - 1) * 12, pageNumber * 12),
        current: pageNumber
      }
    )
  }
  // 从所有的艺术品里筛选出列表typeList
  setTypeList(num) {
    this.setState({loading: true})
    // 拍卖方式
    if(num > 0) {
      let typeList = this.state.allList
      if (this.state.imgType != 0) {
        typeList = typeList.filter(item => item.imgType == this.state.imgType)
      }
      if (num == this.state.auction) {
        num = 0
      } else {
        typeList = typeList.filter(item => item.auction == num)
      }
      this.setState({
        typeList: typeList,
        list: typeList.slice(0, 12),
        current: 1,
        loading: false,
        auction: num
      })
    } else {
      let typeList = this.state.allList
      if (this.state.auction != 0) {
        typeList = typeList.filter(item => item.auction == this.state.auction)
      }
      if (num == this.state.imgType) {
        num = 0
      } else {
        typeList = typeList.filter(item => item.imgType == num)
      }
      this.setState({
        typeList: typeList,
        list: typeList.slice(0, 12),
        current: 1,
        loading: false,
        imgType: num
      })
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
        priceType: item.reservePrice != '0' ? '2' : (item.buyPrice == '0' ? '3' : '1'), // 1一口价，2拍卖，3不卖
        auction: item.reservePrice != '0' ? (deteNow > item.auctionStartTime ? '1' : '2') : (item.buyPrice == '0' ? '4' : '3'), // 1拍卖中 2未开始拍卖 3一口价  4不卖
        countdown: deteNow > item.auctionStartTime ? (item.auctionEndTime - deteNow) * 1000 : (item.auctionStartTime - deteNow) * 1000 ,
        price: (item.reservePrice != '0' ?  item.reservePrice : item.buyPrice) + ' CTXC',
        token: item.tokenId,
        hasAddress: item.hasAddress,
        artistAddress: item.artistAddress,
        hasImgUrl: item.hasImgUrl,
        artistImgUrl: item.artistImgUrl,
        // 以后做
        collection: false,
        look: '125'
      }
    })
    this.setState(
      {
        allList: res,
        typeList: res,
        list: res.slice(0, 12),
        total: res.length,
        loading: false
      }
    )
    
  }
  sortClick (obj) {
    this.setState({loading: true})
    if (obj.key == '0') {
      this.state.typeList.sort((x, y) => x.countdown - y.countdown)
    }
    if (obj.key == '1') {
      this.state.typeList.sort((x, y) => y.countdown - x.countdown)
    }
    if (obj.key == '2') {
      this.state.typeList.sort((x, y) => parseInt(x.price) - parseInt(y.price))
    }
    if (obj.key == '3') {
      this.state.typeList.sort((x, y) => parseInt(y.price) - parseInt(x.price))
    }
    console.log(this.state.typeList)
    this.setState({
      loading: false,
      typeList: [...this.state.typeList],
      list: this.state.typeList.slice(this.state.current * 12 - 12, this.state.current * 12)
    })
  }
  render() {
    const menu = (
      <ThemeContext.Consumer>
        {
          value => (
            <Menu onClick = {this.sortClick}>
              {
                ['timeup', 'timedown', 'priceup', 'pricedown'].map((item,index) => (
                  <Menu.Item key={index}>{json[value.lan][item]}</Menu.Item>
                ))
              }
            </Menu>
          )
        }
      </ThemeContext.Consumer>
      
    )
    return (
      <ThemeContext.Consumer>
        {(value) => (
          <div className='box'>
            <div className='search'>
              <h1>{json[value.lan].gallery}</h1>
              <div className='searchButton'>
                <div className='left'>
                  <Button className= {this.state.auction === 1 ? 'is' : ''} onClick={() => {
                    this.setTypeList(1)
                  }}>{json[value.lan].auction1}</Button>
                  <Button className= {this.state.auction === 2 ? 'is' : ''} onClick={() => {
                    this.setTypeList(2)
                  }}>{json[value.lan].auction2}</Button>
                  <Button className= {this.state.auction === 3 ? 'is' : ''} onClick={() => {
                    this.setTypeList(3)
                  }}>{json[value.lan].auction3}</Button>
                  <Button className= {this.state.auction === 4 ? 'is' : ''} onClick={() => {
                    this.setTypeList(4)
                  }}>{json[value.lan].auction4}</Button>
                </div>
                <div className='center'>
                  <Button className= {this.state.imgType === -1 ? 'is' : ''} onClick={() => {
                    this.setTypeList(-1)
                  }}>{json[value.lan].imgType1}</Button>
                  <Button className= {this.state.imgType === -2 ? 'is' : ''} onClick={() => {
                    this.setTypeList(-2)
                  }}>{json[value.lan].imgType2}</Button>
                </div>
                <div className='right'>
                  <Dropdown overlay={menu}>
                    <a className="ant-dropdown-link">
                      { this.state.sort ?  json[value.lan][this.state.sort] : json[value.lan].sorting}<DownOutlined />
                    </a>
                  </Dropdown>
                </div>
              </div>
            </div>
            <Spin spinning={this.state.loading}>
              <div className="pagBox">
                {
                  this.state.list.map((item,index) => (
                    <div className={`list auction${item.auction}`} key = {index}>

                      <Link to={`/auction/${item.token}`}>
                        <img src={item.img} className='flur' alt=""  />
                      </Link>
                      <span className={`type ${value.lan}`}>{json[value.lan].show[item.auction - 1]}</span>
                      <h3>
                        <span className="name">{item.name}</span>
                        {
                          // 不卖的不展示售价
                          item.priceType != '3' &&
                          <span>
                            <span className="pricename">{json[value.lan][`price${item.priceType}`]}</span>
                            <span className="price">{item.price}</span>
                          </span>
                        }
                        
                      </h3>
                      
                      <h3 className='hasor'>
                        <span>
                          <Link to={`/user/${item.artistAddress}`}>
                            <img src={item.artistImgUrl} alt=""/>
                            {json[value.lan].artist}
                          </Link>
                          <Link to={`/user/${item.hasAddress}`}>
                            <img src={item.hasImgUrl} alt=""/>
                            {json[value.lan].holders}
                          </Link>
                        </span>
                        <HeartOutlined
                          title={json[value.lan].collection}
                          style={{ color: item.collection ? 'green' : 'red' }}
                        />
                      </h3>
                      {
                        (item.auction == 1 || item.auction == 2) &&
                        <p style = {{backgroundColor: ['#57b27a', '#eb973f'][item.auction - 1]}}>
                          {json[value.lan].countdown}:  &nbsp;
                          {getday(item.countdown)}  
                          {json[value.lan].day}  &nbsp;
                          {geth(item.countdown % (1000 * 60 * 60 * 24))}  
                          {json[value.lan].hour}  &nbsp;
                          {getm(item.countdown % (1000 * 60 * 60))}  
                          {json[value.lan].minutes}  &nbsp;
                          {gets(item.countdown % (1000 * 60))}  
                          {json[value.lan].seconds}
                      </p>
                      }
                      
                    </div>
                  ))
                }
                <div className='clear'></div>
              </div>
            </Spin>

            <Pagination simple defaultPageSize={12} current= {this.state.current} defaultCurrent={1} total={this.state.total} onChange={this.onChange} />
          </div>
            
        )}
      </ThemeContext.Consumer>
    );
    
  }
}


export function Gallery(props: any) {
  return (
    <div id="gallery">
      <Listshow></Listshow>
    </div>
  );
}
