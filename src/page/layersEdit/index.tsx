import React, { useState } from 'react';
import { Input, Select, message, Tooltip, Button, Tabs, Steps,Collapse, InputNumber, Spin } from 'antd';
const { TabPane } = Tabs;

const { Option } = Select;
const { Step } = Steps;
const { Panel } = Collapse;
import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
const json = require('./lan.json');
import { ThemeContext } from '../../index';
import { Link } from 'react-router-dom';
import {API, uploadAvatar, walletSign} from '../../fetch/fetch'
import './layersEdit.less'
import {ipfsGet} from '../../fetch/ipfs.js'
import { web3Object } from '../../interface/contract.js'
import {sendTransactionInCtxwallet} from '../../interface/sendTransaction.js'
import moment from 'moment';
declare const window: any;



export  class LayersEdit extends React.Component {
  static contextType = ThemeContext;
  constructor(props:any) {
    super(props)
    this.state = {
      canvas: {
        canvasName: '',
        ins: '',
        layers: [],
        type:'',
        introduce: '',
        token: '',
        width: 0,
        height: 0
      },
      layers: [],
      showLayer: {},
      loading: false
    }
  }
  state: {
    canvas: {
      canvasName: string,
      ins: string,
      layers: [],
      type:string,
      introduce: string,
      width: any,
      height: any,
      token: any
    },
    layers: Array<any>,
    showLayer: any,
    loading: boolean
  }
  props: any
  async componentDidMount(){
    var  address = this.context.address
    const  token = this.props.match.params.token
    if (!token || !address) window.history.go(-1)
    const ownAddress = await web3Object.managerContract.methods.ownerOf(token).call({ gas: 1000000})
    if (ownAddress.toUpperCase() !== address.toUpperCase()) {
      window.history.go(-1)
      return
    }
    try {
      const hash = await web3Object.managerContract.methods.tokenURI(token).call({gas: 1000000})
      let obj = await ipfsGet(hash)
      let canvasContent
      obj = JSON.parse(obj[0].content.toString())
      if(obj.list) {
        // 循环加载当前图层的各个状态图片
        for (let j = 0; j < obj.list.length; j ++) {
          let imgContent = await ipfsGet(obj.list[j])
          obj.list[j] = imgContent[0].content.toString()
        }
        this.state.showLayer = obj
        const canvashash = await web3Object.managerContract.methods.tokenURI(obj.canvasTokenId).call({gas: 1000000})
        canvasContent = await ipfsGet(canvashash)
        canvasContent = JSON.parse(canvasContent[0].content.toString())
        canvasContent.token = obj.canvasTokenId
        this.state.canvas = canvasContent
      }else {
        this.state.canvas = obj
        this.state.canvas.token = token
      }
      this.state.layers = []
      // 按照画布的token和图层的length，循环获取各个图层信息
      for (let i = 1; i < this.state.canvas.layers.length + 1; i ++) {
        const layerToken = this.state.canvas.token - 0 + i + ''
        const layerHash = await web3Object.managerContract.methods.tokenURI(layerToken).call({ gas: 1000000})
        let layerContent = await ipfsGet(layerHash)
        layerContent = JSON.parse(layerContent[0].content.toString())
        // 循环加载当前图层的各个状态图片
        for (let j = 0; j < layerContent.list.length; j ++) {
          let imgContent = await ipfsGet(layerContent.list[j])
          layerContent.list[j] = imgContent[0].content.toString()
        }
        const showIndex = await web3Object.managerContract.methods.getControlToken(layerToken).call({ gas: 1000000})
        if (layerToken == token) {
          this.state.showLayer = { ...layerContent,  tokenId: layerToken, showIndex: showIndex[2] - 0}
        }
        this.state.layers.push({ ...layerContent,  tokenId: layerToken, showIndex: showIndex[2] - 0})
      }
      this.setState({canvas: {...this.state.canvas}, layers: [...this.state.layers], showLayer: {...this.state.showLayer}})
      console.log(this.state)
      this.canvasRender()
    } catch(error) {
      console.log(error)
      message.error(JSON.stringify(error))
    }
  }
  stateChange(index){
    this.setState({showLayer: {...this.state.showLayer, showIndex: index}})
    setTimeout(() => {
      this.canvasRender()
    },100)
  }
  canvasRender(){
    const canvas:any = document.querySelector('#canvas')
    const ctx = canvas.getContext('2d')
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    ctx.clearRect(0,0,width,height)
    let l = 1
    if (width < this.state.canvas.width || height < this.state.canvas.height) {
      l = Math.min(width / this.state.canvas.width, height / this.state.canvas.height)
    }
    for (let i = 0; i < this.state.layers.length; i ++) {
      let item = this.state.layers[i]
      if (item.tokenId == this.state.showLayer.tokenId) {
        item = this.state.showLayer
      }
      var img = new Image()
      img.src = item.list[item.showIndex]
      img.onload = () => {
        ctx.drawImage(img, 0, 0, img.width * l, img.height * l)
        ctx.stroke()
      }
    }

  }
  render() {
    const canvas = this.state.canvas,
          layers = this.state.layers,
          showLayer = this.state.showLayer
    return (
      <ThemeContext.Consumer>
        {
          value => (
            <div id='layersEdit'>
              <div className='contentBox'>
                <Spin spinning={this.state.loading}>
                  <h1 key={showLayer.name}>
                    {showLayer.name ? json[value.lan].layer : json[value.lan].canvas}-{showLayer.name || canvas.canvasName}
                  </h1>
                  <div className='flex'>
                    {
                      showLayer.name && <div className='info'>
                        <h3>{json[value.lan].describe}</h3>
                        <p>{showLayer.introduce}</p>
                        <h3>{json[value.lan].states}</h3>
                        <div className='imgListW'>
                          {
                            showLayer.list.map((item, index) => <img 
                            className={index == showLayer.showIndex ? 'redBorder' : ''} 
                            src={item} key={Math.random()} 
                            onClick={() => {this.stateChange(index)}} alt=""
                            />)
                          }
                          <div className='clear'></div>
                        </div>
                        <Button>{json[value.lan].determine}</Button>
                      </div>
                    }
                    <div className='canvas'>
                      <h2>{json[value.lan].preview}</h2>
                      <canvas id='canvas'>

                      </canvas>
                    </div>
                  </div>
                  
                  {
                    layers.length > 0 &&
                    <div className='layer'>
                      <h2>{json[value.lan].layer}</h2>
                      <div className='imgBox'>
                        {
                          layers.map(item => (
                            <Tooltip title={item.name} key={Math.random()}>
                              <img key={Math.random()} src={item.list[0]} alt=""/>
                            </Tooltip>
                          ))
                        }
                      </div>
                    </div>
                  }
                  
                </Spin>
              </div>
            </div>
          )
        }
      </ThemeContext.Consumer>
    )
  }
}
