import React, { useState } from 'react';
import { Input, Button, Progress, notification } from 'antd';
import { ThemeContext } from '../../index';
import { UpOutlined, DownOutlined, LoginOutlined } from '@ant-design/icons';
const json = require('./lan.json');
const list = require('./galleries.json');
const artist = require('./artist.json');
import { Foot } from './../../component/foot/foot';
import { Link } from 'react-router-dom';
import './home.less';

declare const window: any;

// 介绍框
function Introduce() {
  return (
    <ThemeContext.Consumer>
      {(value) => (
          <div id="homeIntroduce">
            <div className="dis">
              <div className="dis1">{json[value.lan].dis1}</div>
              <div className="dis2">{json[value.lan].dis2}</div>
              <div className="dis3">{json[value.lan].dis3}</div>
              <p className="buttonList">
                <Button type="primary" size={'large'}>
                  {json[value.lan].link4}
                </Button>
                <Button size={'large'}>
                  {json[value.lan].link5}
                </Button>
              </p>
            </div>
          </div>
      )}
    </ThemeContext.Consumer>
  );
}
// 画廊
function Carouselpic() {
  const [num, setNum] = useState(0);
  const [countdown, setNum2] = useState(0);
  window.imgtimeout && clearTimeout(window.imgtimeout);
  window.imgtimeout = setTimeout(() => {
    setNum2(countdown + 1);
    if (countdown >= 100) {
      setNum2(0);
      changenum('1');
    }
  }, 100);
  function changenum(n: any) {
    if (typeof n === 'string') {
      let destination: number = num + parseInt(n);
      switch (destination) {
        case list.length:
          setNum(0);
          break;
        case -1:
          setNum(list.length - 1);
          break;
        default:
          setNum(destination);
      }
    } else {
      setNum(n);
    }
    setNum2(0);
  }
  return (
    <ThemeContext.Consumer>
      {(value) => (
        <div id="Carouselpic">
          <h2>{json[value.lan].titie}</h2>
          <div className="imgList">
            <div
              className="imgbox"
              style={{
                width: `${600 * list.length}px`,
                left: `${300 - num * 600}px`
              }}
            >
              {
                list.map((item, index) => (
                  <div onClick={
                    () => {
                      changenum(index)
                    }}
                    key={index}
                    className={` imgShow ${num === index ? 'show' : ''} ${num > index ? 'lag' : ''} ${num < index ? 'min' : ''}`}
                    >
                    <img src={item.imgurl}/>
                    <p className="dis">{item.dis[value.lan]}</p>
                    <h3 className="name">{item.name}</h3>
                    <p className="artist">{item.artist}</p>
                  </div>
                ))
              }
            </div>
          </div>

          <div className="listNum">
            <UpOutlined
              onClick={() => {
                changenum('-1');
              }}
            />
            {list.map((item, index) => (
              <span
                key={index}
                onClick={() => {
                  changenum(index)
                }}
                className={index === num  ? 'show' : ''}
              >
                {index + 1 > 9 ? index + 1 : '0' + (index + 1)}
                <img src={item.imgurl} alt="" />
              </span>
            ))}
            <DownOutlined
              onClick={() => {
                changenum('1');
              }}
            />
          </div>
          <div className="Progress">
            <Progress
              type="circle"
              width={60}
              trailColor={'black'}
              strokeColor={'white'}
              showInfo={false}
              percent={countdown}
            ></Progress>
          </div>
        </div>
      )}
    </ThemeContext.Consumer>
  );
}
// 艺术家介绍
function ArtistList() {
  const [num2, setNum2] = useState(0);
  const [countdown2, setCount] = useState(0);
  window.imgtimeout2 && clearTimeout(window.imgtimeout2);
  window.imgtimeout2 = setTimeout(() => {
    setCount(countdown2 + 1);
    if (countdown2 >= 100) {
      setCount(0);
      changenum('1');
    }
  }, 100);
  function changenum(n: any) {
    if (typeof n === 'string') {
      let destination: number = num2 + parseInt(n);
      switch (destination) {
        case list.length:
          setNum2(0);
          break;
        case -1:
          setNum2(list.length - 1);
          break;
        default:
          setNum2(destination);
      }
    } else {
      setNum2(n);
    }
    setCount(0);
  }
  return (
    <ThemeContext.Consumer>
      {(value) => (
        <div id="ArtistList">
          <h2>{json[value.lan].artist}</h2>
          <div className="imgList">
            <div
              className="imgbox"
              style={{
                height: `${300 * list.length}px`,
                top: `${150 - num2 * 300}px`
              }}
            >
                {
                  artist.map((item:any, index) => (
                    <div 
                      onClick={() => {
                        changenum(index)
                      }}
                      key={index}
                      className={`imgShow ${num2 === index ? 'show' : ''}`}>
                      <img src={item.imgurl}/>
                      <h3 className="name">{item.name}</h3>
                      <p className="title">{item.title}</p>
                      {
                        num2 === index ? (
                          <p className="dis">
                            {
                              item.dis[value.lan].split('').map((item, index) => (
                                <span key={index} style = {
                                  {
                                    'animationDelay': index * 0.1 + .5 + 's'
                                  }
                                }>
                                  {item}
                                </span>
                              ))
                            }
                          <Link to={`/user/${item.id}`}>
                            <LoginOutlined title={'前往个人主页'} />
                          </Link>
                          </p>
                        ) : ''
                      }
                    </div>
                  ))
                }
            </div>
          </div>
          <div className="listNum">
            <UpOutlined
              onClick={() => {
                changenum('-1');
              }}
            />
            {artist.map((item, index) => (
              <span
                key={index}
                onClick={() => {
                  changenum(index)
                }}
                className={index === num2  ? 'show' : ''}>
                {index + 1 > 9 ? index + 1 : '0' + (index + 1)}
                <span>{item.name}</span>
              </span>
            ))}
            <DownOutlined
              onClick={() => {
                changenum('1');
              }}
            />
          </div>
          <div className="Progress">
            <Progress
              type="circle"
              width={60}
              trailColor={'black'}
              strokeColor={'white'}
              showInfo={false}
              percent={countdown2}
            ></Progress>
          </div>
          {/* <div className="allArtist">
              <Button onClick={() => {

              }}>所有艺术家</Button>
          </div> */}
        </div>
      )}
    </ThemeContext.Consumer>
  );
}
// 加入我们

function Join() {
  return (
    <ThemeContext.Consumer>
      {(value) => (
          <div id="joinus">
            <h2>{json[value.lan].join}</h2>
            <p>
              <Button>{json[value.lan].link3}</Button>
            </p>
          </div>
      )}
    </ThemeContext.Consumer>
  );
}
export class Home extends React.Component {
  componentDidMount() {
    const body = document.querySelector('body'),
      home = document.querySelector('#home') as HTMLElement,
      foot = document.querySelector('#appFoot') as HTMLElement;
    let homeIndex = 0,
      homeboxNum = document.querySelectorAll('#home>div').length - 2;
    let mouselimite: boolean = false;
    body.style.overflow = 'hidden';
    // 首页禁止滚动条，当触发滚动事件，就翻一页
    const onmousewheel = (ev: any) => {
      if (mouselimite) {
        return;
      }
      mouselimite = true;
      setTimeout(() => {
        mouselimite = false;
      }, 2000);
      const down: boolean = ev.wheelDelta ? ev.wheelDelta < 0 : ev.detail > 0,
        height = body.clientHeight,
        width = body.clientWidth;
      if (down) {
        homeIndex = Math.min(homeIndex + 1, homeboxNum);
      } else {
        homeIndex = Math.max(homeIndex - 1, 0);
      
}
      home.style.transform = `translateY(-${homeIndex * height}px)`;
      fn(width, height);
    };
    document.addEventListener('DOMMouseScroll', onmousewheel, false);
    window.onmousewheel = onmousewheel;
    // 防止用户自己修改浏览器分辨率，导致页面样式崩盘
    function fn(w, h) {
      const arr = [
        document.querySelector('#homeIntroduce') as HTMLElement,
        document.querySelector('#Carouselpic') as HTMLElement,
        document.querySelector('#ArtistList') as HTMLElement,
        document.querySelector('#joinus') as HTMLElement
      ];
      arr[0].style.width = w;
      arr[0].style.height = h;
      arr[1].style.height = h;
      arr[2].style.height = h;
      arr[3].style.height = ` ${h - 400}px`;
    }
    
  }
  componentWillUnmount() {
    document.querySelector('body').style.overflow = '';
    window.imgtimeout && clearTimeout(window.imgtimeout);
    window.imgtimeout2 && clearTimeout(window.imgtimeout2);
    document.removeEventListener('DOMMouseScroll', null, false);
    window.onmousewheel = null;
  }
  render() {
    return (
      <div id="home">
        <Introduce></Introduce>
        <Carouselpic></Carouselpic>
        <ArtistList></ArtistList>
        <Join></Join>
        <Foot></Foot>
      </div>
    );
  }
}
