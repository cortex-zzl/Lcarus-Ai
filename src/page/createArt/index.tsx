import React, { useState } from 'react';
import { Input, Upload, message, Form, Button, Spin, Steps,Collapse, InputNumber } from 'antd';
const { Step } = Steps;
const { Panel } = Collapse;
import { DeleteOutlined, UploadOutlined , CheckOutlined} from '@ant-design/icons';
const json = require('./lan.json');
import { ThemeContext } from '../../index';
import { Link } from 'react-router-dom';
import {API, uploadAvatar, walletSign} from '../../fetch/fetch'
import './createArt.less'
import { web3Object } from '../../interface/contract.js'
declare const window: any;
import Web3 from 'web3'
import {ipfsAdd} from '../../fetch/ipfs.js'
import {sendCoin, sendTransactionInCtxwallet} from '../../interface/sendTransaction.js'

function getBase64(img, callback) {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result));
  reader.readAsDataURL(img);
}

function beforeUpload(file) {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/gif' || file.type === 'image/jpg';
  if (!isJpgOrPng) {
    message.error('You can only upload JPG/PNG/GIF file!');
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error('Image must smaller than 2MB!');
  }
  return isJpgOrPng && isLt2M;
}



export  class createArt extends React.Component {
  static contextType = ThemeContext;
  constructor(props:any) {
    super(props)
    this.COINS = this.COINS.bind(this)
    this.COINS2 = this.COINS2.bind(this)
    this.state = {
      current: 0,
      uploadData: {
        canvasName: '',
        // 画布有多个图层
        layers: [ 
          {
            name: '',
            introduce: '',
            showIndex: 0, 
            // 每个图层有多个状态
            list: []
          } 
        ],
        width: 0,
        height: 0,
        isComplete: false,
        tokenId: null,
      },
      loading: false,
      loadingM:'',
      coinEnd: false,
      canvasCoin: false,
      coins: [],
      canvasTokenId: ''
    }
  }
  state: {
    current: number,
    uploadData:{
      canvasName: string,
      layers: Array<{
        name: string,
        introduce: string,
        list: any,
        showIndex: number
      }>,
      width: any,
      height: any,
      isComplete: boolean,
      tokenId: any,
    }
    loading: boolean,
    loadingM:string,
    coinEnd: boolean,
    canvasCoin: boolean, // 主画布是否铸币完成
    coins: Array<number>, // 完成铸币的图层下标
    canvasTokenId: string // 画布的token，
  }
  async COINS(item:any) {
    this.setState({loading: true, loadingM: 'save Canvas'})
    const canvasJson = JSON.stringify({
      width: this.state.uploadData.width,
      height: this.state.uploadData.height,
      canvasName: this.state.uploadData.canvasName,
      creatTime: new Date(),
      layers: this.state.uploadData.layers.map(item => {
        return {
          name: item.name,
          introduce: item.introduce,
          list: item.list.map(todo => {
            return todo.response.hash
          })
        }
      })
    })
    try {
      const ipfsRes = await ipfsAdd(Buffer.from(canvasJson))
      this.setState({loading: true, loadingM: 'Check user permissions'})
      var  address = this.context.address
      this.setState({loadingM: 'Assign artwork IDs'})

      let tokenId = await web3Object.managerContract.methods.expectedTokenSupply().call({gas: 1000000})
      this.state.uploadData.tokenId = tokenId
      const obj = [
        address,
        tokenId,
        this.state.uploadData.layers.length,
        window.artSalesProceeds[0],
        window.artSalesProceeds[1]
      ]
      this.setState({loadingM: 'Art Registration'})
      const whitelistTokenForCreator = web3Object.managerContract.methods.whitelistTokenForCreator(...obj).encodeABI()
      // const whitelistTokenForCreator = web3Object.managerContract2.methods.func(5).encodeABI()
      sendCoin(whitelistTokenForCreator, address).then(res => {
      this.setState({loadingM: 'Start COINS'})
      const addressS = this.state.uploadData.layers.map(item => address)
      console.log(tokenId, ipfsRes[0].hash, addressS)
      if(window.walletModel === 1) {
        const ctrData = web3Object.managerContract.methods.mintArtwork(tokenId, ipfsRes[0].hash, addressS).encodeABI()
        sendTransactionInCtxwallet(ctrData, this.context.address, 0, (err,b) => {
          this.setState({loading: false})
          console.log(err, b)
          if (err == undefined) {
            this.setState({ loadingM: 'End COINS',canvasCoin: true, canvasTokenId: tokenId})
          }
        })
      }
      if (window.walletModel === 2){
        web3Object.managerContract.methods.mintArtwork(
          tokenId, ipfsRes[0].hash, addressS
          ).send({from: address})
          .then(res => {this.setState({loading: false, loadingM: 'End COINS',canvasCoin: true, canvasTokenId: tokenId})})
          .catch(err => console.log(err))
      }
      }).catch(err => console.log(err))
    } catch(err) {
      console.log(err)
    }
    
    
  }
  async COINS2(index: number) {
    var  address = this.context.address
    const layerTokenId = this.state.uploadData.tokenId - 0 + index + 1
    this.setState({loading: true, loadingM: 'Save Layers Data'})
    const layerJson = JSON.stringify({
      name: this.state.uploadData.layers[index].name,
      introduce: this.state.uploadData.layers[index].introduce,
      layerTokenId,
      canvasTokenId: this.state.canvasTokenId,
      list: this.state.uploadData.layers[index].list.map(item => {
        return item.response.hash
      })
    })
    const ipfsRes = await ipfsAdd(Buffer.from(layerJson))
    this.setState({loadingM: 'Start COINS'})
    const obj = [
      layerTokenId,
      ipfsRes[0].hash,
      [0],
      [this.state.uploadData.layers[index].list.length],
      -1,
      []
    ]
    if(window.walletModel === 1) {
      const ctrData = web3Object.managerContract.methods.setupControlToken(...obj).encodeABI()
      sendTransactionInCtxwallet(ctrData, address, 0, (err,b) => {
        console.log(err,b)
        if (err == undefined) {
          this.setState({
            loading: false,
            loadingM: 'End COINS',
            canvasCoin: true,
            coins: this.state.coins.concat([index])
          })
          if (this.state.coins.length === this.state.uploadData.layers.length) {
            this.setState({coinEnd: true})
          }
        }
      })
    }
    if (window.walletModel === 2){
      web3Object.managerContract.methods.setupControlToken(...obj).send({from: address})
      .then(res => 
        {
          this.setState({
            loading: false,
            loadingM: 'End COINS',
            canvasCoin: true,
            coins: this.state.coins.concat([index])
          })
          if (this.state.coins.length === this.state.uploadData.layers.length) {
            this.setState({coinEnd: true})
          }
        })
      .catch(error => this.setState({loadingM: JSON.stringify(error), loading: false}))
    }
    
  }
  async componentDidMount(){
    // 注册为艺术家白名单
    // var  address = this.context.address
    // const whitelistTokenForCreator = web3Object.managerContract.methods.whitelistUser(address).encodeABI()
    // sendCoin(whitelistTokenForCreator, address).then(res => {
    //   console.log(res)
    //   }).catch(err => console.log(err))
    // if (window.localStorage.uploadData){
    //   this.setState({uploadData: JSON.parse(window.localStorage.uploadData)})
    // }
    window.onbeforeunload=function(e){
      var e = window.event||e;  
      e.returnValue=(json[window.localStorage.language].error7);
    }
    web3Object.managerContract.methods.artistWhitelist(this.context.address).call({gas:1000000})
    .then(res => {
      // 用户没有创建艺术品的权限
      if (!res) {
        message.error('no permissions')
      }
    })
  }
  componentWillUnmount(){
    // 如果没有完成就退出，存在本地
    if (!this.state.uploadData.isComplete) {
      window.localStorage.uploadData = JSON.stringify(this.state.uploadData)
      // window.localStorage.stepCurrent = this.state.current
    }
    window.onbeforeunload = null
  }
  handleChange = (info, item) => {
    // if (info.file.status === 'uploading') {
    //   this.setState({ loading: true });
    //   return;
    // }
    if (info.file.status === 'removed') {
      item.list = info.fileList
    }
    // if (info.file.status === 'error') {
    //   item.list = item.list.filter(todo => todo.name !== info.file.name)
    // }
    if (info.file.status === 'done') {
      // Get this url from response in real world.
      item.list = info.fileList
      this.setState({uploadData: {...this.state.uploadData}})
    }
  };
  render() {
    const next = (lan) => {
      const uploadData = this.state.uploadData
      if (this.state.current === 0) {
        if (!uploadData.canvasName) {
          message.error(json[lan].error1)
          return
        }
        if (!uploadData.width || !uploadData.height ) {
          message.error(json[lan].error2)
          return
        }
        if (uploadData.layers.length === 0 ) {
          message.error(json[lan].error3)
          return
        }
        if (uploadData.layers.find(item => !item.name)) {
          message.error(json[lan].error5)
          return
        }
        if (
          uploadData.layers.find(item => item.list.length === 0)
        ) {
          message.error(json[lan].error4)
          return
        }
      }
      this.setState({current: this.state.current + 1})
    };
    const prev = (lan) => {
      this.setState({current: this.state.current - 1})
    };
    const genExtra = (index) => (
      <ThemeContext.Consumer>  
        {
          value => (

            <DeleteOutlined 
            onClick={event => {
              event.stopPropagation()
              if(confirm(json[value.lan].confirm)) {
                const data = {
                  canvasName : this.state.uploadData.canvasName,
                  layers: this.state.uploadData.layers.filter((todo, I) => I != index)
                }
                this.setState({uploadData: data})
              }
            }}/>
          )
        }
      </ThemeContext.Consumer>
     
      
    );
    return (
      <ThemeContext.Consumer>
        {
          value => (
            <div id='createArt'>
              <div className='contentBox'>
                <h1>
                  {json[value.lan].upload}
                </h1>
                <div className="steps">
                  <Steps current={this.state.current}>
                    <Step title={json[value.lan].step1}/>
                    <Step title={json[value.lan].step2}/>
                    <Step title={json[value.lan].step3}/>
                  </Steps>
                </div>
                <div className="stepContent">
                  {
                    this.state.current === 0 && (
                      // step1 上传
                      <div className='step1Content'>
                        <h2>
                          <span >{json[value.lan].canvas}{json[value.lan].name}</span>
                          <Input value={this.state.uploadData.canvasName} onChange={(e) => {
                            this.setState({uploadData: {...this.state.uploadData, canvasName: e.target.value}})
                          }}></Input>
                        </h2>
                        <h2>
                          <span >{json[value.lan].canvas}{json[value.lan].size}</span>
                          <InputNumber value={this.state.uploadData.width}  min={0} max={2160}  onChange={(e) => {
                            this.setState({uploadData: {...this.state.uploadData, width: e}})
                          }}></InputNumber>
                          &nbsp;&nbsp;X&nbsp;&nbsp;
                          <InputNumber value={this.state.uploadData.height}  min={0} max={2160} onChange={(e) => {
                            this.setState({uploadData: {...this.state.uploadData, height: e}})
                          }}></InputNumber>
                        </h2>
                        <Button className='add' onClick={() => {
                          const data = {
                            ...this.state.uploadData,
                            layers: this.state.uploadData.layers.concat({
                              name: '',
                              introduce: '',
                              list: [],
                              showIndex: 0
                            }),
                          }
                          this.setState({uploadData: data})
                        }}>+</Button>
                        {/* {this.state.uploadData.layers.length === 0 && <p>暂无图层</p>} */}
                        <Collapse accordion>
                          {
                            this.state.uploadData.layers.map((item, index) => (
                              <Panel header={item.name || `${json[value.lan].layer}${index + 1}`} key={index} extra={genExtra(index)}>
                                <div className='layerBox'>
                                  <div className='layerLeft'>
                                    <span>
                                      {json[value.lan].layer + (index + 1)}
                                    </span>
                                  </div>
                                  <div className='layerRight'>
                                    <Input value={item.name} placeholder={`${json[value.lan].layer}${json[value.lan].name}`} onChange={(e) => {
                                      let data = this.state.uploadData
                                      data.layers[index].name = e.target.value
                                      this.setState({uploadData: data})
                                    }}></Input>
                                    <Input.TextArea value={item.introduce} placeholder={json[value.lan].dis}
                                    onChange={(e) => {
                                      let data = this.state.uploadData
                                      data.layers[index].introduce = e.target.value
                                      this.setState({uploadData: data})
                                    }} rows={4}></Input.TextArea>
                                    <Upload
                                      listType="picture"
                                      accept="png"
                                      defaultFileList={item.list}
                                      beforeUpload = {(file, fileList) => {
                                        return new Promise((resolve, reject) => {
                                          const isLt2M = file.size / 1024 / 1024 <=2//图片大小不超过2MB
                                          if (item.list.find(todo => todo.name === file.name) !== undefined) {
                                            message.error(json[value.lan].error6)
                                            return reject(false)
                                          }
                                          return resolve(file)
                                        });
                                      }}
                                      customRequest = {(v) => {
                                        getBase64(v.file, data => {
                                          ipfsAdd(Buffer.from(data))
                                          .then(res => {
                                            v.onSuccess(res[0], v.file)
                                          })
                                          .catch(res => {
                                            v.onError(res[0], v.file)
                                          })
                                        })
                                      }}
                                      onChange={(v) => {this.handleChange(v, item)}}
                                    >
                                      <Button icon={<UploadOutlined />}>Upload</Button>
                                    </Upload>
                                  </div>
                                </div>
                              </Panel>
                            ))
                          }
                        </Collapse>
                      </div>
                    )
                  }
                  {
                    this.state.current === 1 && (
                      <div className='step2Content'>
                        <div className='canvasBox' style = {{
                          width: '400px',
                          overflow: 'hidden',
                          height: 400 * (this.state.uploadData.height/this.state.uploadData.width) + 'px'
                        }}>
                          {
                            this.state.uploadData.layers.map(item => (
                              <img src={item.list[item.showIndex].thumbUrl} key={item.name} alt=""/>
                            ))
                          }
                        </div>
                        <Collapse>
                          {
                            this.state.uploadData.layers.map((item, index) => (
                              <Panel header={item.name || `${json[value.lan].layer}${index + 1}`} key={index}>
                                <div className='imgList'>
                                  {
                                    item.list.map((todo, _index) => (
                                      <img className={_index === item.showIndex ?'is':''} src={todo.thumbUrl} key={_index}  onClick={() => {
                                        item.showIndex = _index
                                        this.setState({uploadData: {...this.state.uploadData}})
                                      }}/>
                                    ))
                                  }
                                  <div className='clear'></div>
                                </div>
                              </Panel>
                            ))
                          }
                        </Collapse>
                      </div>
                    )
                  }
                  {
                    this.state.current === 2 && (
                    <Spin tip={this.state.loadingM} spinning ={this.state.loading} size="large">
                      <div className='step2Content step3Content'>
                        <Button disabled={this.state.canvasCoin} onClick={() => this.COINS('')} className='step3Canvas'>
                          {json[value.lan].step3}
                          {this.state.canvasCoin && <CheckOutlined />}
                        </Button>
                        <div className='canvasBox' style = {{
                          width: '400px',
                          overflow: 'hidden',
                          height: 400 * (this.state.uploadData.height/this.state.uploadData.width) + 'px'
                        }}>
                          {
                            this.state.uploadData.layers.map(item => (
                              <img src={item.list[item.showIndex].thumbUrl} key={item.name} alt=""/>
                            ))
                          }
                        </div>
                        <Collapse>
                          {
                            this.state.uploadData.layers.map((item, index) => (
                              <Panel header={item.name || `${json[value.lan].layer}${index + 1}`} key={index}>
                                <div className='imgList'>
                                  {
                                    item.list.map((todo, _index) => (
                                      <img className={_index === item.showIndex ? 'is' : ''} src={todo.thumbUrl} key={_index}  onClick={() => {
                                        item.showIndex = _index
                                        this.setState({uploadData: {...this.state.uploadData}})
                                      }}/>
                                    ))
                                  }
                                  <div className='clear'></div>
                                </div>
                                <div className='step3'>
                                  <Button disabled={!this.state.canvasCoin || this.state.coins.indexOf(index) > -1} onClick={() =>this.COINS2(index)}>
                                    {json[value.lan].step3}
                                    {this.state.coins.indexOf(index) > -1 && <CheckOutlined />}
                                  </Button>
                                </div>
                              </Panel>
                            ))
                          }
                        </Collapse>
                      </div>
                    </Spin>
                    )
                  }
                </div>
                <div className='nextButton'> 
                  <Button onClick={() => {prev(value.lan)}} disabled={this.state.current === 0 || this.state.canvasCoin}>
                    {json[value.lan].prev}
                  </Button>
                  {
                    this.state.current < 2 ? (
                      <Button onClick={() => {next(value.lan)}} >
                        {json[value.lan].next}
                      </Button>
                    ) : (
                      <Button onClick={() => {window.localStorage.uploadData = null}} disabled={!this.state.coinEnd}>
                        <Link  to={`/priceSet/${this.state.uploadData.tokenId}`}>{json[value.lan].step4}</Link>
                        
                      </Button>
                    )
                  }
                  
                </div>
              </div>
            </div>
          )
        }
      </ThemeContext.Consumer>
    )
  }
}

