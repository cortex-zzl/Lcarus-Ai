
window.artSalesProceeds = [15, 5] // 艺术家首次和2次出售平台分成
window.mainAddress = '0x9672484ba8cb1ad1f32dc955b09b7f2ed262e7cc'  // 合约地址
window.publicAddress = '0x0b18c352E7fE19EfEa86A7e545fCE0D30951Af6B' // 有些页面不需要登录，但是需要地址调用合约
window.defaultImg = 'https://ss1.bdstatic.com/70cFvXSh_Q1YnxGkpoWK1HF6hhy/it/u=3600922054,1964265679&fm=26&gp=0.jpg' // 目前画布没有图片，这是默认图片
window.defaultImgT = 'https://ss3.bdstatic.com/70cFv8Sh_Q1YnxGkpoWK1HF6hhy/it/u=2070453827,1163403148&fm=26&gp=0.jpg' // 默认头像
window.defaultUnit = 1 // 默认的交易单位，鉴于前期测试需要，ctxc单位太大， 1ctxc = Math(10, 18)个基本单位
window.ipfsConfig = {host: '127.0.0.1', port: '5001', protocol: 'http'} // ipfs服务器配置
window.walletModel = 1 // 使用的钱包 1 ctx钱包   2 metamask,这个钱包一直更新，相关代码可能失效
