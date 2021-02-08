import { Home } from './page/home/index';
import { User } from './page/user/index';
import { Gallery } from './page/gallery/index';
import { Auction } from './page/auction/index';
import { userEdit } from './page/userEdit/index';
import { createArt } from './page/createArt/index';
import { generateLayer } from './page/generateLayer/index';
import { priceSet } from './page/priceSet/index';
import React, { useState } from 'react';
import { message } from 'antd';


declare const window: any;

export function NoPerDom () {
  const lan = window.localStorage.language
  const lans = {
    zn: '用户未下载钱包或者没有登录，请登录钱包后刷新页面',
    en: 'The user is not downloading the wallet or logging in，Please login and refresh the page',
    hn: '사용자가 지갑을 다운로드하지 않았거나 로그인하지 않았습니다. 로그인 후 새로고침'
  }
  message.error(lans[lan], 5)
  return <div style={ { 
    color: 'red',
    fontSize: '40px',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  } }>download: <a style={{fontSize: '24px'}} href="https://www.cortexlabs.ai/wallet" target='_blank'> cortex wallet</a></div>
}


// 不需要登录钱包能进的页面
export const whiteRoutes = [
  {
    name: '首页',
    path: '/',
    component: Home
  },
  {
    name: '艺术家主页',
    path: '/user/:userid',
    component: User
  },
  {
    name: '画廊',
    path: '/gallery',
    component: Gallery
  },
  {
    name: '拍卖界面',
    path: '/auction/:token',
    component: Auction
  }
]
// 需要登录钱包
export const perRoutes = [
  {
    name: '编辑个人信息',
    path: '/userEdit',
    component: userEdit
  },
  {
    name: '艺术品上传',
    path: '/createArt',
    component: createArt
  },
  {
    name: '艺术品生成',
    path: '/generateLayer',
    component: generateLayer
  },
  {
    name: '艺术品定价',
    path: '/priceSet/:token',
    component:  priceSet 
  }
]