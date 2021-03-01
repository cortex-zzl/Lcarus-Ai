import React, { useState } from 'react';
import { Input, Select, message, DatePicker, Button, Tabs, Steps,Collapse, InputNumber, Spin } from 'antd';
const { TabPane } = Tabs;

const { Option } = Select;
const { Step } = Steps;
const { Panel } = Collapse;
import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
const json = require('./lan.json');
import { ThemeContext } from '../../index';
import { Link } from 'react-router-dom';
import {API, uploadAvatar, walletSign} from '../../fetch/fetch'
import './priceSet.less'
import {ipfsGet} from '../../fetch/ipfs.js'
import { web3Object } from '../../interface/contract.js'
import {sendTransactionInCtxwallet} from '../../interface/sendTransaction.js'
import moment from 'moment';
declare const window: any;



export  class priceSet extends React.Component {
  static contextType = ThemeContext;
  constructor(props:any) {
    super(props)
    this.state = {
      current: 0,
      data: [],
      loading: true,
      address: ''
    }
  }
  state: {
    current: number,
    data: any,
    loading: boolean,
    address: string
  }
  props: any
  async componentDidMount(){
    var  address = this.context.address
    this.state.address = address
    const  token = this.props.match.params.token
    if (!token || !address) window.history.go(-1)
    const ownAddress = await web3Object.managerContract.methods.ownerOf(token).call({ gas: 1000000})
    if (ownAddress.toUpperCase() !== address.toUpperCase()) {
      window.history.go(-1)
      return
    }
    try {
      const arr = []
      const hash = await web3Object.managerContract.methods.tokenURI(token).call({gas: 1000000})
      let canvasContent = await ipfsGet(hash)
      canvasContent = JSON.parse(canvasContent[0].content.toString())
      // 查询售价
      const canvasPrice = await web3Object.managerContract.methods.sellingState(token).call({ gas: 1000000})
      let canvasPriceType = '3'
      if(canvasPrice.buyPrice != '0')  {
        canvasPriceType = '1'
      }
      if(canvasPrice.reservePrice != '0')  {
        canvasPriceType = '2'
      }
      arr.push({...canvasContent, type: json[window.localStorage.language].canvas, tokenId: token, priceType: canvasPriceType, ...canvasPrice})
      if(canvasContent.list) {
        // 循环加载当前图层的各个状态图片
        for (let j = 0; j < canvasContent.list.length; j ++) {
          let imgContent = await ipfsGet(canvasContent.list[j])
          canvasContent.list[j] = imgContent[0].content.toString()
        }
      }
      if(canvasContent.layers) {
        // 按照画布的token和图层的length，循环获取各个图层信息
        for (let i = 1; i < canvasContent.layers.length + 1; i ++) {
          const layerToken = token - 0 + i + ''
          const ownAddress = await web3Object.managerContract.methods.ownerOf(layerToken).call({ gas: 1000000})
          // 这个图层有可能已经单独卖掉了，没有拥有权就不能再修改价格
          if (ownAddress.toUpperCase() !== address.toUpperCase()) {
            continue
          }
          const layerHash = await web3Object.managerContract.methods.tokenURI(layerToken).call({ gas: 1000000})
          let layerContent = await ipfsGet(layerHash)
          layerContent = JSON.parse(layerContent[0].content.toString())
          // 循环加载当前图层的各个状态图片
          for (let j = 0; j < layerContent.list.length; j ++) {
            let imgContent = await ipfsGet(layerContent.list[j])
            layerContent.list[j] = imgContent[0].content.toString()
          }
          // 从合约获取当前图层/画布的售卖方式和售价
          const layerPrice = await web3Object.managerContract.methods.sellingState(layerToken).call({gas: 1000000})
          let layerPriceType = '3'
          if(layerPrice.buyPrice != '0')  {
            layerPriceType = '1'
          }
          if(layerPrice.reservePrice != '0')  {
            layerPriceType = '2'
          }
          arr.push({priceType: layerPriceType, ...layerContent,  tokenId: layerToken, ...layerPrice})
        }
      }
      this.setState({data: arr, loading: false})
    } catch(error) {
      message.error(JSON.stringify(error))
    }
  }
  changePrice(data, num){
    const obj = [
      data.tokenId,
      data.buyPrice * window.defaultUnit, // 1ctxc = 10的18次方个基本单位
      '0',
      '0',
      '0'
    ]
    if (num == 2) {
      obj[2] = data.auctionStartTime
      obj[3] = data.auctionEndTime
      obj[4] = data.reservePrice * window.defaultUnit
    }
    if (num == 3) {
      obj[1] = '0'
    }
    this.setState({loading: true})
    if(window.walletModel === 1) {
      const ctrData = web3Object.managerContract.methods.setSellingState(...obj).encodeABI()
      sendTransactionInCtxwallet(ctrData, this.state.address, 0, (err,b) => {
        console.log(err,b)
        this.setState({loading: false})
        if (err == undefined) {
          data.priceType = num
          message.success('success')
          this.setState({data: [...this.state.data]})
        }
      })
    }
    if (window.walletModel === 2){
      web3Object.managerContract.methods.setSellingState(...obj).send({from: this.state.address})
      .then(res =>  {
        this.setState({loading: false})
        data.priceType = num
        message.success('success')
        this.setState({data: [...this.state.data]})
      })
      .catch(res => {
        message.error('error')
        this.setState({loading: false})
      })
    }
  }
  render() {
    const genExtra = (item) => (
      <ThemeContext.Consumer>  
        {
          value => (
              <span>
                {json[value.lan]['type' + item.priceType]}
                &nbsp;{item.price}
              </span>
          )
        }
      </ThemeContext.Consumer>
    );
    const canChange = (data) => {
      // 已经开始拍卖的，不能修改
      if (data.priceType == '2' && data.startTime < moment().unix()){
        return true
      }
      return false
    }
    return (
      <ThemeContext.Consumer>
        {
          value => (
            <div id='priceSet'>
              <div className='contentBox'>
                <h1>
                  {json[value.lan].price}
                </h1>
                <Spin spinning={this.state.loading}>
                  <Collapse accordion>
                    {
                      this.state.data.map((item, index) => (
                        <Panel key={index}  header={`${index == 0 ? item.type + '-' : ''}${item.canvasName || item.name}`}  extra={genExtra(item)}>
                          <div className='imgList'>
                            {
                              item.list && item.list.map(todo => (
                                <img key={todo} src={todo} alt=""/>
                              ))
                            }
                            <div className='clear'></div>
                          </div>
                          <Tabs  defaultActiveKey={item.priceType}>
                            <TabPane tab={json[value.lan].type1} key="1">
                              <InputNumber min={0} value={item.buyPrice} onChange={v => {
                                const data = item
                                data.buyPrice = v
                                this.state.data[index] = data

                                this.setState({data: [...this.state.data]})
                              }}></InputNumber>
                              <Button className='ok' onClick={() => {this.changePrice(item, 1)}} disabled={canChange(item)}>{json[value.lan].ok}</Button>
                            </TabPane>
                            <TabPane tab={json[value.lan].type2} key="2">
                              <h3>{json[value.lan].price1}</h3>
                              <InputNumber min={0} value={item.reservePrice} onChange={v => {
                                const data = item
                                data.reservePrice = v
                                const timeLim = data.auctionEndTime - data.auctionStartTime
                                data.canCommit = timeLim > 0 &&  timeLim < 604800
                                this.state.data[index] = data

                                this.setState({data: [...this.state.data]})
                              }}>
                              </InputNumber>
                              <h3>{json[value.lan].time1}</h3>
                              <DatePicker
                                showTime
                                disabledDate={(current)=> {
                                  return current <= moment().endOf('seconds') || current > moment().add(3, 'day')
                                }}
                                defaultValue = {item.auctionStartTime != 0 ? moment(new Date(item.auctionStartTime * 1000)) : moment(new Date())}
                                onChange={(date) => {
                                  let dataClone = item
                                  dataClone.auctionStartTime = date.unix()
                                  const timeLim = dataClone.auctionEndTime - dataClone.auctionStartTime
                                  dataClone.canCommit = timeLim > 0 &&  timeLim < 604800
                                  this.state.data[index] = dataClone
                                  this.setState({data: [...this.state.data]})
                                  console.log(item)
                                }}>
                                  
                              </DatePicker>
                              <h3>{json[value.lan].time2}</h3>
                              <DatePicker
                                key={new Date().getTime()}
                                disabled = {item.auctionStartTime == 0}
                                showTime
                                disabledDate={(current)=> {
                                  return current.unix() < item.auctionStartTime || current > moment(new Date(item.auctionStartTime * 1000)).add(7, 'day')
                                }}
                                defaultValue = {
                                  item.auctionEndTime != '0' ? moment(new Date(item.auctionEndTime * 1000)) :moment(new Date(item.auctionStartTime * 1000)).add(7, 'day')
                                }
                                onChange={(date) => {
                                  let dataClone = item
                                  dataClone.auctionEndTime = date.unix()
                                  const timeLim = dataClone.auctionEndTime - dataClone.auctionStartTime
                                  dataClone.canCommit = timeLim > 0 &&  timeLim < 604800
                                  this.state.data[index] = dataClone
                                  this.setState({data: [...this.state.data]})
                                }}>
                              </DatePicker>
                              {/* <h3>{json[value.lan].price2}</h3>
                              <InputNumber min={0}></InputNumber> */}
                              <h3>{json[value.lan].type1}</h3>
                              <InputNumber min={0} value={item.buyPrice} onChange={v => {
                                const data = item
                                data.buyPrice = v
                                this.state.data[index] = data

                                this.setState({data: [...this.state.data]})
                              }}></InputNumber>
                              <Button className='ok'
                                onClick={() => {this.changePrice(item, 2)}}
                                disabled={canChange(item) || !item.canCommit}>
                                  {json[value.lan].ok}
                              </Button>
                            </TabPane>
                            <TabPane tab={json[value.lan].type3} key="3">
                              {json[value.lan].dis}
                              <Button className='ok' onClick={() => {this.changePrice(item, 3)}}  disabled={canChange(item)}>{json[value.lan].ok}</Button>
                            </TabPane>
                          </Tabs>
                        </Panel>
                      ))
                    }
                    
                  </Collapse>
                </Spin>
              </div>
            </div>
          )
        }
      </ThemeContext.Consumer>
    )
  }
}
