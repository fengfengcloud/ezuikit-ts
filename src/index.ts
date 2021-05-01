import { Params } from './types/parmas';
import { Options, EZUIKit } from './types/EZUIKit';

const DOMAIN = "https://open.ys7.com"
const FILE_PATH_DOMAIN = DOMAIN
const CONTROL_FOOTER_ID = 'iframe-btn-container'
// ---------------- hide element style -------------------------
const STYLE_HIDE = 'display:none!important; margin-left:20px'
const STYLE_SHOW = 'display: inline-block; margin-left:20px'

declare let layer: any

declare global {
  interface Window {
    ActiveXObject: any;
    layer: any; Recorder: any;
    webkitAudioContext: typeof AudioContext;
    startTalk: any;
    stopTalk: any;
    EZUIKit: any;
  }

  interface Document {
    mozCancelFullScreen: any;
    webkitCancelFullScreen: any;
  }

  interface Navigator {
    webkitGetUserMedia: typeof MediaDevices
  }
}

let EZUIKit: Omit<EZUIKit, 'params' | 'iframe' | 'domElement'>  = {
  EZUIKitPlayer: undefined,
  EZUIKitTalk: undefined,
  opt: {
    apiDomain: 'https://open.ys7.com/api/lapp/live/talk/url',
    filePath: 'https://open.ys7.com/assets/ezuikit_v2.6.4',
    accessToken: '',
    url: '',
    deviceSerial: '',
    channelNo: '',
    id: '',
    talkLink: '',
    rtcUrl: '',
    ttsUrl: '',
    stream: '',
    // 对讲插件依赖
    isReliesReady: false,
    template: 'simple',
    plugin: [],
    // 加载插件，talk-对讲
    audio: 1,
    // 声音id  0-不开启 1-开启
    autoplay: 1,
    videoLoading: false,
  },
  state: {
    countTimer: undefined,
    // countTime 计时器
    recodeTime: 0,
    // 录音时间
    recodeTimer: undefined,
    //录音时长 计时器
    fetchDefaultList: false,
    // 是否拉取默认语音-当用户语音为空
    page: 0,
    // 语音当前页
    pageSize: 5
  },
  handleTalkSuccess: function () { },
  handleTalkError: function () { },
};

export default class EZUIKitPlayer {
  public id: string;
  public EZUIKitPlayer: any;
  private onHistroyCallBack;
  public EZUIKitTalk:any;
  private opt: Options;
  private domElement: HTMLElement;
  private iframe: HTMLIFrameElement;
  private debounceTimer: any;
  // private state: {
  //   countTimer: any;
  //   recodeTime: number;
  //   recodeTimer: number;
  //   fetchDefaultList: boolean;
  //   page: number;
  //   pageSize: number;
  // };
  private params: Params;
  constructor(params: Params) {
    this.id = params.id
    this.opt = {
      id: params.id,
      apiDomain: `${DOMAIN}/api/lapp/live/talk/url`,
      filePath: `${FILE_PATH_DOMAIN}/assets/ezuikit_v2.6.4}`,
      accessToken: '',
      url: '',
      deviceSerial: '',
      channelNo: '',
      talLink: '',
      rtcUrl: '',
      ttsUrl: '',
      stream: '',
      isReliesReady: false,
      template: 'simple',
      plugin: [],
      audio: 1,
      autoplay: 1,
      fullScreenStatus: 0,
      bSupporDoubleClickFull: true,
      videoLoading: false,
    }

    this.params = params
    this.debounceTimer = false
    this.onHistroyCallBack = params.onHistroyCallBack

    if (params.url) {
      this.opt.url = params.url;
      this.opt.deviceSerial = params.url.split("/")[3];
      this.opt.channelNo = params.url.split("/")[4].split(".")[0];
    }

    if (typeof params.template !== 'undefined') {
      this.opt.template = params.template;
    }

    if (params.plugin && params.plugin?.length > 0) {
      this.opt.plugin = params.plugin;
    }

    if (typeof params.autoplay !== 'undefined') {
      this.opt.autoplay = params.autoplay ? 1 : 0;
    }

    if (typeof params.bSupporDoubleClickFull !== 'undefined') {
      this.opt.bSupporDoubleClickFull = params.bSupporDoubleClickFull;
    }
    if (typeof params.handleTalkSuccess !== 'undefined') {
      window.EZUIKit.handleTalkSuccess = params.handleTalkSuccess;
    }
    if (typeof params.handleTalkError !== 'undefined') {
      window.EZUIKit.handleTalkError = params.handleTalkError;
    }

    this.domElement = document.getElementById(this.opt.id) as HTMLElement; // 间隙
    if (this.domElement) {
      this.domElement.style.fontSize = '0px'
      this.domElement.style.position = 'relative';
      this.domElement.style.overflowY = 'auto';
    }
    this.iframe = document.createElement('iframe')
    const matchIframeUrl = (): string => {
      switch (this.opt.template) {
        case 'simple':
          let iframeUrl = DOMAIN + "/ezopen/h5/iframe?bSupporDoubleClickFull=0&url=" + this.opt.url.replace("?", "&") + "&autoplay=" + this.opt.autoplay + "&audio=" + this.opt.audio + "&accessToken=" + params.accessToken + "&templete=0" + "&id=" + this.opt.id;
          let controlsValue = "";
          if (typeof params.controls !== 'undefined' && params.controls) {
            console.log("typeof", typeof params.controls)
            controlsValue = "play,voice,hd,fullScreen";
            if (params.controls.length > 0) {
              controlsValue = params.controls.join(",");
              iframeUrl += ('&controls=' + controlsValue);
            }
          }
          if (params.websocketParams) {
            iframeUrl += ('&websocketParams=' + JSON.stringify(params.websocketParams))
          }
          return iframeUrl;
        case 'standard':
          return DOMAIN + "/ezopen/h5/iframe?bSupporDoubleClickFull=0&url=" + this.opt.url.replace("?", "&") + "&autoplay=" + this.opt.autoplay + "&audio=" + this.opt.audio + "&accessToken=" + params.accessToken + "&templete=1" + "&id=" + this.opt.id;
    
        case 'security':
          return DOMAIN + "/ezopen/h5/iframe_se?bSupporDoubleClickFull=0&url=" + this.opt.url.replace("?", "&") + "&autoplay=" + this.opt.autoplay + "&audio=" + this.opt.audio + "&accessToken=" + params.accessToken + "&templete=0" + "&id=" + this.opt.id;;
    
        default:
          return DOMAIN + "/ezopen/h5/iframe?bSupporDoubleClickFull=0&url=" + this.opt.url.replace("?", "&") + "&autoplay=" + this.opt.autoplay + "&audio=" + this.opt.audio + "&accessToken=" + params.accessToken + "&templete=0" + "&id=" + this.opt.id;;
      }
    }
    this.iframe.src = matchIframeUrl() // 获取容器的宽高
    let iframeHeight = (document.getElementById(this.opt.id) as HTMLElement).clientHeight;
    let iframeWidth = (document.getElementById(this.opt.id) as HTMLElement).clientWidth;

    if (params.height) {
      iframeHeight = (typeof params.height === 'number') ?  params.height : parseInt(params.height as string);
    }

    if (params.width) {
      iframeWidth = (typeof params.width === 'number') ?  params.width : parseInt(params.width as string);
    }

    this.iframe.width = iframeWidth + '';
    this.iframe.height = iframeHeight + '';
    this.iframe.id = 'EZUIKitPlayer-' + this.opt.id; // 部分iframe属性

    this.iframe.setAttribute("allowfullscreen", 'true');
    this.iframe.setAttribute("allow", "autoplay");
    this.iframe.setAttribute("frameborder", '0');
    this.domElement.appendChild(this.iframe);
    let jqueryJS = this.opt.filePath + '/js/jquery.js';
    let layerJs = 'https://open.ys7.com/assets/layer/layer.js';
    addJs(jqueryJS, () => {
      addJs(layerJs, () => {
        const matchHeaderOpt = () => {
          let result = {
            headerContainer: false,
            capturePictureModule: false,
            saveModule: false,
            zoomModule: false,
            fullScreenModule: false,
            historyModule: false
          };
          let template = this.opt.template;

          switch (template) {
            case 'simple':
              if (params.header && params.header instanceof Array) {
                let header = params.header;
                result = {
                  headerContainer: true,
                  capturePictureModule: header.indexOf('capturePicture') !== -1,
                  saveModule: header.indexOf('save') !== -1,
                  zoomModule: header.indexOf('zoom') !== -1,
                  fullScreenModule: header.indexOf('fullScreen') !== -1,
                  historyModule: header.indexOf('history') !== -1
                };
              }

              break;

            case 'standard':
              break;

            case 'security':
              break;

            case 'voice':
              result = {
                headerContainer: true,
                capturePictureModule: true,
                saveModule: true,
                zoomModule: true,
                fullScreenModule: true,
                historyModule: true
              };
              break;
          }

          return result;
        }
        //   });
        // });
        /**
        * 渲染header
        */

        if (matchHeaderOpt().headerContainer) {
          // if (params.header && params.header instanceof Array) {
          let headerContainer = document.createElement('div');
          headerContainer.setAttribute('class', 'panel-top');
          headerContainer.setAttribute('style',
            `padding:10px 0;display: inline-block;text-align:left;z-index:1000;position:absolute;bottom:0px;color:#fff;background:rgba(0,0,0,0.65);cursor:pointer;width:100%;`
          )
          let controsDOM = document.createElement('div');
          controsDOM.setAttribute('class', 'contros');
          headerContainer.appendChild(controsDOM);
          this.domElement.insertBefore(headerContainer, this.iframe);

          // TODO: set visibility
          setTimeout(() => {
            headerContainer.style.transform = 'translate3d(0, 100%, 0)'
            headerContainer.style.transition = 'all .2s ease'
          }, 18);
          this.domElement.addEventListener('mouseover', () => {
            clearTimeout(this.debounceTimer)
            headerContainer.style.transform = 'translate3d(0, 0, 0)'
          }, false)
          this.domElement.addEventListener('mouseout', () => {
            this.debounceTimer = setTimeout(() => {
              headerContainer.style.transform = 'translate3d(0, 100%, 0)'
            }, 3000)
          }, false)

          if (matchHeaderOpt().capturePictureModule) {
            // 截图
            let capturePictureDOM = document.createElement('span');
            capturePictureDOM.style.marginLeft = '20px'
            capturePictureDOM.innerHTML = '<span title="截图">' + '<svg id="capturePicture" title="截图" t="1578882764585" class="icon" viewBox="0 0 1024 1024" version="1.1"' + '  xmlns="http://www.w3.org/2000/svg" p-id="5958" width="24" height="24">' + '  <path' + '    d="M887.296 315.904h-153.6c-51.2 0-68.096-102.4-119.296-102.4H392.704c-34.304 0-51.2 102.4-102.4 102.4h-153.6c-29.696 0-51.2 21.504-51.2 51.2v439.296c0 25.6 21.504 47.104 51.2 47.104h751.104c29.696 0 51.2-21.504 51.2-51.2v-435.2c-0.512-30.208-21.504-51.2-51.712-51.2zM512 768c-115.2 0-204.8-89.6-204.8-200.704s89.6-200.704 204.8-200.704 204.8 89.6 204.8 200.704-93.696 200.704-204.8 200.704z m247.296-354.304c-12.8 0-25.6-12.8-25.6-25.6s12.8-25.6 25.6-25.6 25.6 12.8 25.6 25.6c0 17.408-12.8 25.6-25.6 25.6zM256 264.704c0-8.704-8.704-16.896-16.896-16.896h-51.2c-8.704 0-16.896 8.704-16.896 16.896V281.6H256v-16.896z m256 148.992c-85.504 0-153.6 68.096-153.6 153.6s68.096 153.6 153.6 153.6 153.6-68.096 153.6-153.6-68.096-153.6-153.6-153.6z"' + '    fill="#ffffff" p-id="5959"></path>' + '</svg>' + '</span>';

            capturePictureDOM.onclick = () => {
              this.capturePicture();
            };

            controsDOM.appendChild(capturePictureDOM);
          }

          console.log("matchHeaderOpt().saveModule", matchHeaderOpt().saveModule);

          if (matchHeaderOpt().saveModule) {
            let startSaveDOM = document.createElement('span');
            startSaveDOM.style.marginLeft = '20px'
            startSaveDOM.setAttribute('id', `startSaveWrapper-${this.opt.id}`)
            startSaveDOM.innerHTML = '<span title="开始录像">' + '  <svg id="startSave" t="1578882716693" class="icon" viewBox="0 0 1024 1024" version="1.1"' + '    xmlns="http://www.w3.org/2000/svg" p-id="3782" width="24" height="24">' + '    <path' + '      d="M915.2 729.6l-128-76.8c-25.6-12.8-44.8-32-44.8-51.2V435.2c0-25.6 19.2-38.4 44.8-51.2l128-76.8c25.6-12.8 44.8 0 44.8 19.2V704c0 32-19.2 38.4-44.8 25.6z m-332.8 89.6H96c-51.2 0-89.6-38.4-89.6-89.6V332.8c0-51.2 38.4-89.6 89.6-89.6h486.4c51.2 0 89.6 38.4 89.6 89.6v396.8c0 51.2-38.4 89.6-89.6 89.6zM192 364.8c-32 6.4-57.6 32-64 64-12.8 57.6 38.4 115.2 96 102.4 32-6.4 57.6-32 64-70.4 12.8-57.6-38.4-108.8-96-96z m0 0"' + '      p-id="3783" fill="#ffffff"></path>' + '  </svg>' + '</span>';

            startSaveDOM.onclick = () => {
              this.startSave();
              // TODO: fix class hide
              // (document.getElementById('startSave') as HTMLElement).setAttribute('class', 'icon hide');
              (document.getElementById(`startSaveWrapper-${this.opt.id}`) as HTMLElement).setAttribute('style', STYLE_HIDE);
              // (document.getElementById('stopSave') as HTMLElement).setAttribute('class', 'icon');
              (document.getElementById(`stopSaveWrapper-${this.opt.id}`) as HTMLElement).setAttribute('style', STYLE_SHOW);
            };

            controsDOM.appendChild(startSaveDOM);
            let stopSaveDOM = document.createElement('span');
            stopSaveDOM.style.marginLeft = '20px'
            stopSaveDOM.setAttribute('id', `stopSaveWrapper-${this.opt.id}`)
            stopSaveDOM.innerHTML = '<span title="结束录像">' + ' <svg id="stopSave" t="1578882716693" class="icon hide" viewBox="0 0 1024 1024" version="1.1"' + '   xmlns="http://www.w3.org/2000/svg" p-id="3782" width="24" height="24">' + '   <path' + '     d="M915.2 729.6l-128-76.8c-25.6-12.8-44.8-32-44.8-51.2V435.2c0-25.6 19.2-38.4 44.8-51.2l128-76.8c25.6-12.8 44.8 0 44.8 19.2V704c0 32-19.2 38.4-44.8 25.6z m-332.8 89.6H96c-51.2 0-89.6-38.4-89.6-89.6V332.8c0-51.2 38.4-89.6 89.6-89.6h486.4c51.2 0 89.6 38.4 89.6 89.6v396.8c0 51.2-38.4 89.6-89.6 89.6zM192 364.8c-32 6.4-57.6 32-64 64-12.8 57.6 38.4 115.2 96 102.4 32-6.4 57.6-32 64-70.4 12.8-57.6-38.4-108.8-96-96z m0 0"' + '     p-id="3783" fill="red"></path>' + ' </svg>' + ' </span>';
            stopSaveDOM.onclick = () => {
              this.stopSave();
              // TODO: fix class disable
              // (document.getElementById('stopSave') as HTMLElement).setAttribute('class', 'icon hide');
              (document.getElementById(`startSaveWrapper-${this.opt.id}`) as HTMLElement).setAttribute('style', STYLE_SHOW);
              // (document.getElementById('startSave') as HTMLElement).setAttribute('class', 'icon');
              (document.getElementById(`stopSaveWrapper-${this.opt.id}`) as HTMLElement).setAttribute('style', STYLE_HIDE);
            };

            controsDOM.appendChild(stopSaveDOM);

            setTimeout(() => {
                            // default set dispaly none
              (document.getElementById(`stopSaveWrapper-${this.opt.id}`) as HTMLElement).setAttribute('style', STYLE_HIDE);
            }, 20)
          }

          if (matchHeaderOpt().zoomModule) {
            let enableZoomDOM = document.createElement('span');
            enableZoomDOM.style.marginLeft = '20px'
            enableZoomDOM.setAttribute('id', `zoomWrapper-${this.opt.id}`)
            enableZoomDOM.innerHTML = '<span title="开启电子放大">' + '  <svg id="enableZoom" t="1578882639834" class="icon" viewBox="0 0 1000 1000" version="1.1"' + '    xmlns="http://www.w3.org/2000/svg" p-id="2227" width="24" height="24">' + '    <path' + '      d="M830.6119 441.1089c0-193.7756-157.0939-350.8641-350.8775-350.8641S128.8559 247.3333 128.8559 441.1089 285.9508 791.972 479.7344 791.972 830.6119 634.8845 830.6119 441.1089zM483.2821 710.4863c-146.7975 0-265.8187-118.9953-265.8187-265.8088S336.4847 178.8697 483.2821 178.8697s265.8197 118.9953 265.8197 265.8078S630.0796 710.4863 483.2821 710.4863zM770.6031 653.5739l-72.6417 75.9485 141.6917 160.1814 82.0737-90.0739L770.6031 653.5739zM527.5849 267.4727h-88.60655762279428v132.90489048425167H306.0690340253259v88.60292721534799h132.90933675248866v132.9038911617923h88.60655762279428V488.9794719180395h132.90933675248866v-88.60292721534799H527.5849284006089V267.4726535408993z"' + '      p-id="2228" fill="#ffffff"></path>' + '  </svg>' + '</span>';

            enableZoomDOM.onclick = () => {
              this.enableZoom();

              (document.getElementById(`zoomWrapper-${this.opt.id}`) as HTMLElement).setAttribute('style', STYLE_HIDE);
              (document.getElementById(`closeZoomWrapper-${this.opt.id}`) as HTMLElement).setAttribute('style', STYLE_SHOW);
            };

            controsDOM.appendChild(enableZoomDOM);
            let closeZoomDOM = document.createElement('span');
            closeZoomDOM.style.marginLeft = '20px'
            closeZoomDOM.setAttribute('id', `closeZoomWrapper-${this.opt.id}`)
            closeZoomDOM.innerHTML = '<span title="关闭电子放大">' + '  <svg id="closeZoom" t="1578882639834" class="icon hide" viewBox="0 0 1000 1000" version="1.1"' + '    xmlns="http://www.w3.org/2000/svg" p-id="2227" width="24" height="24">' + '    <path' + '      d="M830.6119 441.1089c0-193.7756-157.0939-350.8641-350.8775-350.8641S128.8559 247.3333 128.8559 441.1089 285.9508 791.972 479.7344 791.972 830.6119 634.8845 830.6119 441.1089zM483.2821 710.4863c-146.7975 0-265.8187-118.9953-265.8187-265.8088S336.4847 178.8697 483.2821 178.8697s265.8197 118.9953 265.8197 265.8078S630.0796 710.4863 483.2821 710.4863zM770.6031 653.5739l-72.6417 75.9485 141.6917 160.1814 82.0737-90.0739L770.6031 653.5739zM527.5849 267.4727h-88.60655762279428v132.90489048425167H306.0690340253259v88.60292721534799h132.90933675248866v132.9038911617923h88.60655762279428V488.9794719180395h132.90933675248866v-88.60292721534799H527.5849284006089V267.4726535408993z"' + '      p-id="2228" fill="red"></path>' + '  </svg>' + '</span>';

            closeZoomDOM.onclick = () => {
              this.closeZoom();

              (document.getElementById(`closeZoomWrapper-${this.opt.id}`) as HTMLElement).setAttribute('style', STYLE_HIDE);
              (document.getElementById(`zoomWrapper-${this.opt.id}`) as HTMLElement).setAttribute('style', STYLE_SHOW);
            };

            controsDOM.appendChild(closeZoomDOM);

            setTimeout(() => {
              // default set dispaly none
            (document.getElementById(`closeZoomWrapper-${this.opt.id}`) as HTMLElement).setAttribute('style', STYLE_HIDE);
            }, 20)
          }


          if (matchHeaderOpt().historyModule) {
            // 历史记录
            let historyDOM = document.createElement('span');
            historyDOM.style.marginLeft = '20px'
            historyDOM.setAttribute('title', '前往历史记录');
            // fullScreenDOM.setAttribute('style', 'vertical-align: top;');
            historyDOM.innerHTML = '<svg t="1619082219528" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2011" width="24" height="24"><path d="M533.333333 85.333333C384 85.333333 251.733333 166.4 183.466667 290.133333L85.333333 192 85.333333 469.333333l277.333333 0L243.2 349.866667C298.666667 243.2 405.333333 170.666667 533.333333 170.666667c174.933333 0 320 145.066667 320 320 0 174.933333-145.066667 320-320 320-140.8 0-256-89.6-302.933333-213.333333L140.8 597.333333c46.933333 170.666667 204.8 298.666667 392.533333 298.666667 226.133333 0 405.333333-183.466667 405.333333-405.333333S755.2 85.333333 533.333333 85.333333zM469.333333 298.666667l0 217.6 200.533333 119.466667 34.133333-55.466667-170.666667-102.4L533.333333 298.666667 469.333333 298.666667z" p-id="2012" fill="#ffffff"></path></svg>';

            historyDOM.onclick = () => {
              this.onHistroyCallBack()
            };

            controsDOM.appendChild(historyDOM);
          }

          if (matchHeaderOpt().fullScreenModule) {
            // 全屏控制
            let fullScreenDOM = document.createElement('span');
            fullScreenDOM.style.marginLeft = '20px'
            fullScreenDOM.setAttribute('title', '全屏');
            fullScreenDOM.setAttribute('style', `
              display: inline-block;
              position: absolute;
              right: 10px;
              cursor: pointer;
            `)
            // fullScreenDOM.setAttribute('style', 'vertical-align: top;');
            fullScreenDOM.innerHTML = '<svg id="fullScreen" t="1578020167938" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5035" width="24" height="24"> <path d="M348.373333 625.706667l-128 128-64 64v-128a33.28 33.28 0 0 0-35.413333-35.413334A33.493333 33.493333 0 0 0 85.333333 689.706667v213.333333A33.706667 33.706667 0 0 0 120.96 938.666667h213.333333a35.626667 35.626667 0 0 0 0-71.04h-128l64-64 128-128a35.2 35.2 0 0 0-49.92-49.92zM206.293333 156.373333h128a33.28 33.28 0 0 0 35.413334-35.413333A33.493333 33.493333 0 0 0 334.293333 85.333333H113.706667c-7.04 0-14.08 7.04-21.333334 14.293334a26.026667 26.026667 0 0 0-7.04 21.333333v213.333333a33.493333 33.493333 0 0 0 35.626667 35.413334 33.28 33.28 0 0 0 35.413333-35.413334v-128l192 192a35.2 35.2 0 0 0 49.92-49.92zM903.04 85.333333h-213.333333a33.493333 33.493333 0 0 0-35.413334 35.626667 33.28 33.28 0 0 0 35.413334 35.413333h128l-64 64-128 128a35.2 35.2 0 0 0 49.92 49.92l128-128 64-64v128a35.626667 35.626667 0 0 0 71.04 0v-213.333333A33.706667 33.706667 0 0 0 903.04 85.333333zM903.04 654.293333a33.28 33.28 0 0 0-35.413333 35.413334v128l-64-64-128-128a35.2 35.2 0 0 0-49.92 49.92l128 128 64 64h-128a35.626667 35.626667 0 0 0 0 71.04h213.333333A33.706667 33.706667 0 0 0 938.666667 903.04v-213.333333a33.493333 33.493333 0 0 0-35.626667-35.413334z" p-id="5036" fill="#ffffff"></path></svg>';

            fullScreenDOM.onclick = () => {
              this.fullScreen();
            };

            controsDOM.appendChild(fullScreenDOM);
          }
        }
        /**
         * 渲染footer
         */

        /** 根据配置匹配底部渲染 */
        const matchFooterOpt  = () => {
          let result = {
            footerContainer: false,
            talkModule: false,
            broadcastModule: false,
            hdModule: false,
            fullScreenModule: false
          };
          let template = this.opt.template;

          switch (template) {
            case 'simple':
              if (params.footer && params.footer instanceof Array) {
                let footer = params.footer;
                result = {
                  footerContainer: true,
                  talkModule: footer.indexOf('talk') !== -1,
                  broadcastModule: footer.indexOf('broadcast') !== -1,
                  hdModule: footer.indexOf('hd') !== -1,
                  fullScreenModule: footer.indexOf('fullScreen') !== -1
                };
              }

              break;

            case 'standard':
              if (params.footer && params.footer instanceof Array) {
                let footer = params.footer;
                result = {
                  footerContainer: true,
                  talkModule: footer.indexOf('talk') !== -1,
                  broadcastModule: footer.indexOf('broadcast') !== -1,
                  hdModule: footer.indexOf('hd') !== -1,
                  fullScreenModule: footer.indexOf('fullScreen') !== -1
                };
              }

              break;

            case 'security':
              break;

            case 'voice':
              result = {
                footerContainer: true,
                talkModule: true,
                broadcastModule: true,
                hdModule: true,
                fullScreenModule: true
              };
              break;
          }
          return result;
        }
        /** 根据配置匹配底部渲染 */

        if (matchFooterOpt().footerContainer || (this.opt.plugin as string []).indexOf('talk') !== -1) {
          let recoderCSS = this.opt.filePath + '/npm/css/recoder.css';
          let recoderJs = this.opt.filePath + '/npm/js/recoder.js';
          let recorderJs = this.opt.filePath + '/recorder.js'; // addCss()

          addCss(recoderCSS, function () { });
          addJs(recoderJs, function () {
            addJs(recorderJs, function () { });
          }); // 对讲模块

          if ((this.opt.plugin as string []).indexOf('talk') !== -1 || matchFooterOpt().talkModule) {
            const apiSuccess = (data: any) => {
              console.log("data", data);

              if (data.code == 200) {
                let apiResult = data.data;

                if (apiResult) {
                  // 临时将https转换为websocket
                  let rtcTrunk = apiResult.rtcUrl;

                  if (rtcTrunk.indexOf("ws") === -1) {
                    rtcTrunk = rtcTrunk.replace("https", "wss").replace("rtcgw", "rtcgw-ws");
                  }

                  this.opt.rtcUrl = rtcTrunk;
                  this.opt.ttsUrl = "tts://" + apiResult.ttsUrl;
                  let talk = "talk://" + this.opt.deviceSerial + ":0:" + this.opt.channelNo + ":cas.ys7.com:6500";
                  this.opt.talkLink = this.opt.ttsUrl + "/" + talk;
                  this.opt.stream = apiResult.stream;
                  console.log("_this.opt", this.opt); // 加载依赖

                  if (!this.opt.isReliesReady) {
                    let adapeterJS = this.opt.filePath + '/npm/js/adapeter.js';
                    let janusJS = this.opt.filePath + '/npm/js/janus.js';
                    let ttsJS = this.opt.filePath + '/npm/js/tts.js';
                    console.log("加载jquery.js");
                    addJs(adapeterJS, () => {
                      console.log("加载adapeter.js");
                      addJs(janusJS, () => {
                        console.log("加载janus.js");
                        addJs(ttsJS, () => {
                          console.log("加载tts.js"); // 文件加载完毕;

                          this.opt.isReliesReady = true;
                        });
                      });
                    });
                  } // 创建DOM


                  if (!document.getElementById("audioleft")) {
                    let audioleft = document.createElement('div');
                    audioleft.style.display = 'none';
                    audioleft.id = 'audioleft';
                    document.body.appendChild(audioleft);
                  }

                  if (!document.getElementById("audioright")) {
                    let audioright = document.createElement('div');
                    audioright.style.display = 'none';
                    audioright.id = 'audioright';
                    document.body.appendChild(audioright);
                  }
                }
              }
            }

            const apiError = (err: any) => {
              if (params.handleError) {
                params.handleError(err);
              }
            }

            request(this.opt.apiDomain, 'POST', {
              accessToken: this.opt.accessToken,
              deviceSerial: this.opt.deviceSerial,
              channelNo: this.opt.channelNo
            }, '', apiSuccess, apiError);
          }

          if (matchFooterOpt().footerContainer) {
            // 底部容器
            let footerContainer = document.createElement('div');
            footerContainer.setAttribute("class", 'audio-controls');
            this.domElement.appendChild(footerContainer);

            if (matchFooterOpt().hdModule || matchFooterOpt().fullScreenModule) {
              // 底部右侧元素
              let rightContros = document.createElement('div');
              rightContros.setAttribute('class', 'contros');
              footerContainer.appendChild(rightContros);

              if (matchFooterOpt().hdModule) {
                // 高清-标清切换
                let hdDom = document.createElement('span');
                hdDom.setAttribute('id', 'video-hd');
                hdDom.innerHTML = this.opt.url.indexOf('.hd') === -1 ? '标清' : '高清';

                hdDom.onclick = () => {
                  // 停止
                  if (this.opt.videoLoading) {
                    layer.msg("视频加载中，请稍后");
                    return false;
                  } else {
                    let stopPromise = this.stop();
                    this.opt.videoLoading = true;
                    stopPromise.then((data) => {
                      this.opt.videoLoading = false;
                      if (this.opt.url.indexOf('.hd') === -1) {
                        this.opt.url = this.opt.url.replace('.live', '.hd.live');
                        hdDom.innerHTML = this.opt.url.indexOf('.hd') === -1 ? '标清' : '高清';
                      } else {
                        this.opt.url = this.opt.url.replace('.hd.live', '.live');
                        hdDom.innerHTML = this.opt.url.indexOf('.hd') === -1 ? '标清' : '高清';
                      }
                      this.play(this.opt.url)
                    })
                      .catch((error) => {
                        console.log("error", error)
                      })
                  }
                  //iframe.src = domain +"/ezopen/h5/iframe?url=" + _this.opt.url.replace('.hd.live', '.live') + "&autoplay=1&audio=" + _this.opt.audio + "&accessToken=" + _this.opt.accessToken + "&templete=" + 0;
                };

                rightContros.appendChild(hdDom);
              }

              let closeSoundDOM: any = null;
              let openSoundDOM: any = null;


              if (matchFooterOpt().fullScreenModule) {
                // 声音控制
                openSoundDOM = document.createElement('span');
                openSoundDOM.setAttribute('class', 'hide');
                openSoundDOM.setAttribute('id', 'ezuikit-open-sound');
                openSoundDOM.setAttribute('title', '打开声音');
                openSoundDOM.setAttribute('style', 'vertical-align: top;');
                openSoundDOM.innerHTML = '<svg t="1590476263239" class="icon" viewBox="0 0 1178 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2273" width="16" height="16"><path d="M665.6 51.2 665.6 51.2c-10.24-30.72-40.96-51.2-71.68-51.2-5.12 0-15.36 0-20.48 5.12l0 0L358.4 153.6 51.2 209.92l0 0C20.48 220.16 0 250.88 0 281.6 0 286.72 0 291.84 0 307.2l0 0 0 409.6 0 0c0 15.36 0 20.48 0 25.6 0 30.72 20.48 61.44 51.2 71.68l0 0L358.4 870.4l97.28 71.68 107.52 76.8 0 0c5.12 5.12 15.36 5.12 25.6 5.12 40.96 0 76.8-35.84 76.8-76.8 0-10.24 0-10.24 0-25.6l0 0L665.6 51.2zM563.2 870.4l-153.6-102.4-307.2-51.2L102.4 307.2l307.2-51.2 153.6-102.4L563.2 870.4z" p-id="2274" fill="#FF0000"></path><path d="M1049.6 537.6l112.64-112.64c20.48-20.48 20.48-56.32 0-76.8-20.48-20.48-56.32-20.48-76.8 0L972.8 460.8l-112.64-112.64c0 0 0 0 0 0-20.48-20.48-56.32-20.48-76.8 0 0 0 0 0 0 0-20.48 20.48-20.48 56.32 0 76.8l112.64 112.64-112.64 112.64c-20.48 20.48-20.48 56.32 0 76.8 20.48 20.48 56.32 20.48 76.8 0L972.8 614.4l112.64 112.64c20.48 20.48 56.32 20.48 76.8 0s20.48-56.32 0-76.8L1049.6 537.6z" p-id="2275" fill="#FF0000"></path></svg>';

                openSoundDOM.onclick = () => {
                  this.openSound(0);

                  openSoundDOM.setAttribute('class', 'hide');
                  closeSoundDOM.setAttribute('class', '');
                }; // 声音控制


                closeSoundDOM = document.createElement('span');
                openSoundDOM.setAttribute('id', 'ezuikit-close-sound');
                closeSoundDOM.setAttribute('class', 'hide');
                closeSoundDOM.setAttribute('title', '关闭声音');
                closeSoundDOM.setAttribute('style', 'vertical-align: top;');
                closeSoundDOM.innerHTML = '<svg t="1590414410633" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="20545" width="16" height="16"><path d="M840.533333 98.133333c-17.066667-17.066667-42.666667-17.066667-59.733333 0-17.066667 17.066667-17.066667 42.666667 0 59.733334C883.2 256 938.666667 392.533333 938.666667 533.333333c0 140.8-55.466667 277.333333-157.866667 375.466667-17.066667 17.066667-17.066667 42.666667 0 59.733333 8.533333 8.533333 21.333333 12.8 29.866667 12.8 8.533333 0 21.333333-4.266667 29.866666-12.8 115.2-110.933333 183.466667-268.8 183.466667-435.2 0-166.4-68.266667-324.266667-183.466667-435.2zM571.733333 12.8c-17.066667-8.533333-34.133333-4.266667-46.933333 8.533333L281.6 256H42.666667c-25.6 0-42.666667 17.066667-42.666667 42.666667v426.666666c0 25.6 17.066667 42.666667 42.666667 42.666667h238.933333l243.2 234.666667c8.533333 8.533333 17.066667 12.8 29.866667 12.8 4.266667 0 12.8 0 17.066666-4.266667 17.066667-8.533333 25.6-21.333333 25.6-38.4V51.2c0-17.066667-8.533333-34.133333-25.6-38.4zM512 870.4l-183.466667-179.2c-8.533333-4.266667-17.066667-8.533333-29.866666-8.533333H85.333333V341.333333h213.333334c12.8 0 21.333333-4.266667 29.866666-12.8L512 153.6v716.8z" p-id="20546" fill="#ffffff"></path><path d="M759.466667 349.866667c-12.8-21.333333-38.4-25.6-59.733334-8.533334-21.333333 12.8-25.6 38.4-8.533333 59.733334 21.333333 29.866667 34.133333 76.8 34.133333 123.733333 0 46.933333-12.8 93.866667-34.133333 123.733333-12.8 21.333333-8.533333 46.933333 8.533333 59.733334 8.533333 4.266667 17.066667 8.533333 25.6 8.533333 12.8 0 25.6-4.266667 34.133334-17.066667 34.133333-46.933333 51.2-106.666667 51.2-174.933333 0-68.266667-17.066667-128-51.2-174.933333z" p-id="20547" fill="#ffffff"></path></svg>';

                closeSoundDOM.onclick = () => {
                  this.closeSound(0);

                  openSoundDOM.setAttribute('class', '');
                  closeSoundDOM.setAttribute('class', 'hide');
                };

                rightContros.appendChild(openSoundDOM);
                rightContros.appendChild(closeSoundDOM);
              } // 根据当前音频配置展示


              if (this.opt.audio == 1) {
                closeSoundDOM?.setAttribute('class', '');
              } else {
                openSoundDOM?.setAttribute('class', '');

                this.closeSound(0);
              }

              if (matchFooterOpt().fullScreenModule) {
                // 全屏控制
                let fullScreenDOM = document.createElement('span');
                fullScreenDOM.setAttribute('title', '全屏');
                fullScreenDOM.setAttribute('style', 'vertical-align: top;');
                fullScreenDOM.innerHTML = '<svg id="fullScreen" t="1578020167938" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5035" width="16" height="16"> <path d="M348.373333 625.706667l-128 128-64 64v-128a33.28 33.28 0 0 0-35.413333-35.413334A33.493333 33.493333 0 0 0 85.333333 689.706667v213.333333A33.706667 33.706667 0 0 0 120.96 938.666667h213.333333a35.626667 35.626667 0 0 0 0-71.04h-128l64-64 128-128a35.2 35.2 0 0 0-49.92-49.92zM206.293333 156.373333h128a33.28 33.28 0 0 0 35.413334-35.413333A33.493333 33.493333 0 0 0 334.293333 85.333333H113.706667c-7.04 0-14.08 7.04-21.333334 14.293334a26.026667 26.026667 0 0 0-7.04 21.333333v213.333333a33.493333 33.493333 0 0 0 35.626667 35.413334 33.28 33.28 0 0 0 35.413333-35.413334v-128l192 192a35.2 35.2 0 0 0 49.92-49.92zM903.04 85.333333h-213.333333a33.493333 33.493333 0 0 0-35.413334 35.626667 33.28 33.28 0 0 0 35.413334 35.413333h128l-64 64-128 128a35.2 35.2 0 0 0 49.92 49.92l128-128 64-64v128a35.626667 35.626667 0 0 0 71.04 0v-213.333333A33.706667 33.706667 0 0 0 903.04 85.333333zM903.04 654.293333a33.28 33.28 0 0 0-35.413333 35.413334v128l-64-64-128-128a35.2 35.2 0 0 0-49.92 49.92l128 128 64 64h-128a35.626667 35.626667 0 0 0 0 71.04h213.333333A33.706667 33.706667 0 0 0 938.666667 903.04v-213.333333a33.493333 33.493333 0 0 0-35.626667-35.413334z" p-id="5036" fill="#ffffff"></path></svg>';

                fullScreenDOM.onclick = () => {
                  this.fullScreen();
                };

                rightContros.appendChild(fullScreenDOM);
              }
            }
            let startTalkDOM: HTMLElement;

            if (matchFooterOpt().talkModule) {
              // 对讲
              startTalkDOM = document.createElement('div');
              let stopTalkDOM = document.createElement('div');
              startTalkDOM.setAttribute("class", "ptp-talk off");
              startTalkDOM.innerHTML = '<span title="对讲">' + '<svg t="1581930496966" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"' + '  p-id="1641" width="16" height="16">' + '  <path' + '    d="M715.648 647.872c-30.208-22.336-61.568 39.36-100.992 77.44-39.36 38.08-34.112 31.488-123.392-17.088S311.488 540.224 280 491.648C248.448 443.072 265.472 424.704 265.472 424.704s78.72-62.976 97.152-81.344c18.368-18.368 13.12-30.208 13.12-30.208l-128.64-190.144c-23.616-5.184-64.32 5.12-128.576 57.6C54.208 233.088 30.592 353.856 151.296 575.68c120.768 221.824 347.84 330.752 485.568 374.08 137.856 43.328 228.416-61.696 249.408-103.68 21.056-41.984 13.12-85.312 13.12-85.312S745.856 670.208 715.648 647.872z"' + '    p-id="1642" fill="#ffffff"></path>' + '  <path' + '    d="M715.328 64C580.992 64 472.192 172.864 472.192 307.2s108.8 243.2 243.136 243.2 243.2-108.864 243.2-243.2S849.6 64 715.328 64zM715.328 461.056c-84.992 0-153.856-68.864-153.856-153.856s68.864-153.856 153.856-153.856 153.856 68.928 153.856 153.856S800.32 461.056 715.328 461.056z"' + '    p-id="1643" fill="#ffffff"></path>' + '  <path' + '    d="M777.472 277.376c-18.176 0-32.96-14.784-32.96-33.024 0-8.448 3.136-16.064 8.32-21.888-11.52-5.12-24.128-8-37.568-8-51.2 0-92.672 41.472-92.672 92.736s41.472 92.736 92.672 92.736S808.064 358.4 808.064 307.2c0-13.696-3.072-26.688-8.384-38.4C793.728 274.112 786.048 277.376 777.472 277.376zM715.328 340.928c-18.624 0-33.664-15.104-33.664-33.728 0-18.624 15.04-33.728 33.664-33.728 18.688 0 33.728 15.104 33.728 33.728C749.056 325.824 734.016 340.928 715.328 340.928z"' + '    p-id="1644" fill="#ffffff"></path>' + ' </svg>' + ' </span>' + ' <span>开启对讲</span>';

              startTalkDOM.onclick = (event) => {

                if (EZUIKit.state.countTimer) {
                  layer.msg("语音设备正忙，请稍后重试");
                  return false;
                }

                countTime('add', 0);
                console.log("开始对讲，关闭声音");

                this.closeSound(0);

                console.log(this.opt);

                this.startTalk();

                (event.target as HTMLElement).setAttribute("class", "ptp-talk off hide");
                stopTalkDOM.setAttribute("class", "ptp-talk on");
              };

              stopTalkDOM.setAttribute("class", "ptp-talk on hide");
              stopTalkDOM.innerHTML = '<span title="对讲">' + ' <svg t="1581930496966" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"' + '    p-id="1641" width="16" height="16">' + '    <path' + '      d="M715.648 647.872c-30.208-22.336-61.568 39.36-100.992 77.44-39.36 38.08-34.112 31.488-123.392-17.088S311.488 540.224 280 491.648C248.448 443.072 265.472 424.704 265.472 424.704s78.72-62.976 97.152-81.344c18.368-18.368 13.12-30.208 13.12-30.208l-128.64-190.144c-23.616-5.184-64.32 5.12-128.576 57.6C54.208 233.088 30.592 353.856 151.296 575.68c120.768 221.824 347.84 330.752 485.568 374.08 137.856 43.328 228.416-61.696 249.408-103.68 21.056-41.984 13.12-85.312 13.12-85.312S745.856 670.208 715.648 647.872z"' + '      p-id="1642" fill="#ff0000"></path>' + '    <path' + '      d="M715.328 64C580.992 64 472.192 172.864 472.192 307.2s108.8 243.2 243.136 243.2 243.2-108.864 243.2-243.2S849.6 64 715.328 64zM715.328 461.056c-84.992 0-153.856-68.864-153.856-153.856s68.864-153.856 153.856-153.856 153.856 68.928 153.856 153.856S800.32 461.056 715.328 461.056z"' + '      p-id="1643" fill="#ff0000"></path>' + '    <path' + '      d="M777.472 277.376c-18.176 0-32.96-14.784-32.96-33.024 0-8.448 3.136-16.064 8.32-21.888-11.52-5.12-24.128-8-37.568-8-51.2 0-92.672 41.472-92.672 92.736s41.472 92.736 92.672 92.736S808.064 358.4 808.064 307.2c0-13.696-3.072-26.688-8.384-38.4C793.728 274.112 786.048 277.376 777.472 277.376zM715.328 340.928c-18.624 0-33.664-15.104-33.664-33.728 0-18.624 15.04-33.728 33.664-33.728 18.688 0 33.728 15.104 33.728 33.728C749.056 325.824 734.016 340.928 715.328 340.928z"' + '      p-id="1644" fill="#ff0000"></path>' + '  </svg>' + ' </span>' + '<span>关闭对讲</span>';

              stopTalkDOM.onclick = (event) => {
                console.log(this.opt);

                this.stopTalk();

                countTime('destory', 0);

                this.openSound(0);

                (event.target as HTMLElement).setAttribute("class", "ptp-talk on hide");
                startTalkDOM.setAttribute("class", "ptp-talk off");
              };

              footerContainer.appendChild(startTalkDOM);
              footerContainer.appendChild(stopTalkDOM);
            }

            if (matchFooterOpt().broadcastModule) {
              let startBroadcastDOM = document.createElement('div');
              let stopBroadcastDOM = document.createElement('div');
              startBroadcastDOM.setAttribute("class", 'broadcast off');
              stopBroadcastDOM.setAttribute("class", "broadcast on hide");
              startBroadcastDOM.innerHTML = ' <span title="语音播报">' + '  <svg t="1583561695846" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"' + '    p-id="1126" width="16" height="16">' + '    <path' + '      d="M513.82044445 964.38044445c-8.192 0-15.47377778-2.73066667-21.84533334-8.192 0 0-46.42133333-41.87022222-99.21422222-86.47111112-89.20177778-73.728-117.41866667-88.29155555-123.79022222-90.112H35.04355555c-14.56355555 0-26.39644445-11.83288889-26.39644444-27.30666666V271.70133333c0-14.56355555 11.83288889-27.30666667 26.39644444-27.30666666H246.21511111c7.28177778-2.73066667 37.31911111-15.47377778 137.44355556-91.02222222 58.25422222-43.69066667 111.04711111-86.47111111 111.04711111-86.47111112 5.46133333-4.55111111 12.74311111-7.28177778 20.02488889-7.28177778 4.55111111 0 10.01244445 0.91022222 14.56355555 3.6408889 10.92266667 5.46133333 18.20444445 17.29422222 18.20444445 30.03733333v837.40444444c0 12.74311111-7.28177778 25.48622222-19.11466667 30.94755556-5.46133333 1.82044445-10.01244445 2.73066667-14.56355555 2.73066667zM270.79111111 724.992c19.11466667 0 48.24177778 8.192 167.48088889 106.496 16.384 13.65333333 33.67822222 28.21688889 51.88266667 43.69066667l5.46133333 4.55111111V139.71911111l-5.46133333 3.64088889c-22.75555555 17.29422222-44.60088889 34.58844445-65.536 50.06222222C293.54666667 291.72622222 264.41955555 299.008 245.30488889 299.008H82.37511111c-20.02488889 0-21.84533333 12.74311111-21.84533333 26.39644445V694.04444445c0 23.66577778 6.37155555 30.03733333 28.21688889 30.03733333h180.224l1.82044444 0.91022222z m520.64711111 162.01955555c-14.56355555 0-26.39644445-11.83288889-26.39644444-27.30666666 0-11.83288889 8.192-20.02488889 16.384-24.576 112.86755555-67.35644445 182.04444445-191.14666667 182.04444444-324.03911111 0-132.89244445-70.08711111-256.68266667-182.04444444-324.03911111-10.01244445-5.46133333-15.47377778-14.56355555-15.47377778-24.576 0-14.56355555 11.83288889-27.30666667 26.39644445-27.30666667 5.46133333 0 10.01244445 1.82044445 16.384 5.46133333 128.34133333 76.45866667 207.53066667 218.45333333 207.53066666 369.55022222 0 152.00711111-80.09955555 293.09155555-208.44088889 369.55022223-6.37155555 5.46133333-10.92266667 7.28177778-16.384 7.28177777z m-90.112-152.91733333c-14.56355555 0-26.39644445-11.83288889-26.39644444-27.30666667 0-10.01244445 4.55111111-18.20444445 12.74311111-23.66577777 61.89511111-34.58844445 100.12444445-100.12444445 100.12444444-171.12177778 0-70.08711111-37.31911111-134.71288889-96.48355555-170.21155555-8.192-4.55111111-12.74311111-13.65333333-12.74311111-23.66577778 0-14.56355555 11.83288889-27.30666667 26.39644444-27.30666667 4.55111111 0 11.83288889 2.73066667 15.47377778 4.55111111 74.63822222 44.60088889 121.96977778 127.43111111 121.96977778 215.72266667 0 90.112-48.24177778 173.85244445-125.61066667 218.45333333-1.82044445 0-9.10222222 4.55111111-15.47377778 4.55111111z"' + '      fill="#ffffff" p-id="1127"></path>' + '  </svg>' + '</span>' + '<span>语音播报</span>';

              startBroadcastDOM.onclick = function () {
                (this as HTMLElement).setAttribute("class", "broadcast off hide");
                stopBroadcastDOM.setAttribute("class", "broadcast on");
              };

              stopBroadcastDOM.innerHTML = '<div class="pop-hover">' + '  <div class="pop-hover-content">' + '    <div class="vioce-list" id="voice-list">' + '      <ul class="voice-list-ul">' + '      </ul>' + '      <div id="voice-list-end"></div>' + '    </div>' + '    <div id="voice-custom" style="text-align: center;">自定义语音</div>' + '  </div>' + '</div>' + '<span title="语音播报">' + '  <svg t="1583561695846" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"' + '    p-id="1126" width="16" height="16">' + '    <path' + '      d="M513.82044445 964.38044445c-8.192 0-15.47377778-2.73066667-21.84533334-8.192 0 0-46.42133333-41.87022222-99.21422222-86.47111112-89.20177778-73.728-117.41866667-88.29155555-123.79022222-90.112H35.04355555c-14.56355555 0-26.39644445-11.83288889-26.39644444-27.30666666V271.70133333c0-14.56355555 11.83288889-27.30666667 26.39644444-27.30666666H246.21511111c7.28177778-2.73066667 37.31911111-15.47377778 137.44355556-91.02222222 58.25422222-43.69066667 111.04711111-86.47111111 111.04711111-86.47111112 5.46133333-4.55111111 12.74311111-7.28177778 20.02488889-7.28177778 4.55111111 0 10.01244445 0.91022222 14.56355555 3.6408889 10.92266667 5.46133333 18.20444445 17.29422222 18.20444445 30.03733333v837.40444444c0 12.74311111-7.28177778 25.48622222-19.11466667 30.94755556-5.46133333 1.82044445-10.01244445 2.73066667-14.56355555 2.73066667zM270.79111111 724.992c19.11466667 0 48.24177778 8.192 167.48088889 106.496 16.384 13.65333333 33.67822222 28.21688889 51.88266667 43.69066667l5.46133333 4.55111111V139.71911111l-5.46133333 3.64088889c-22.75555555 17.29422222-44.60088889 34.58844445-65.536 50.06222222C293.54666667 291.72622222 264.41955555 299.008 245.30488889 299.008H82.37511111c-20.02488889 0-21.84533333 12.74311111-21.84533333 26.39644445V694.04444445c0 23.66577778 6.37155555 30.03733333 28.21688889 30.03733333h180.224l1.82044444 0.91022222z m520.64711111 162.01955555c-14.56355555 0-26.39644445-11.83288889-26.39644444-27.30666666 0-11.83288889 8.192-20.02488889 16.384-24.576 112.86755555-67.35644445 182.04444445-191.14666667 182.04444444-324.03911111 0-132.89244445-70.08711111-256.68266667-182.04444444-324.03911111-10.01244445-5.46133333-15.47377778-14.56355555-15.47377778-24.576 0-14.56355555 11.83288889-27.30666667 26.39644445-27.30666667 5.46133333 0 10.01244445 1.82044445 16.384 5.46133333 128.34133333 76.45866667 207.53066667 218.45333333 207.53066666 369.55022222 0 152.00711111-80.09955555 293.09155555-208.44088889 369.55022223-6.37155555 5.46133333-10.92266667 7.28177778-16.384 7.28177777z m-90.112-152.91733333c-14.56355555 0-26.39644445-11.83288889-26.39644444-27.30666667 0-10.01244445 4.55111111-18.20444445 12.74311111-23.66577777 61.89511111-34.58844445 100.12444445-100.12444445 100.12444444-171.12177778 0-70.08711111-37.31911111-134.71288889-96.48355555-170.21155555-8.192-4.55111111-12.74311111-13.65333333-12.74311111-23.66577778 0-14.56355555 11.83288889-27.30666667 26.39644444-27.30666667 4.55111111 0 11.83288889 2.73066667 15.47377778 4.55111111 74.63822222 44.60088889 121.96977778 127.43111111 121.96977778 215.72266667 0 90.112-48.24177778 173.85244445-125.61066667 218.45333333-1.82044445 0-9.10222222 4.55111111-15.47377778 4.55111111z"' + '      fill="#ff0000" p-id="1127"></path>' + '  </svg>' + '</span>' + '<span>语音播报</span>'; // //自定义语音唤起
              // document.getElementById("voice-custom").onclick = function(){
              //   console.log("显示自定义语音");
              // }

              stopBroadcastDOM.onclick = function () {
                (this as HTMLElement).setAttribute("class", "broadcast on hide");
                startBroadcastDOM.setAttribute("class", "broadcast off");
              };

              footerContainer.appendChild(startBroadcastDOM);
              footerContainer.appendChild(stopBroadcastDOM); // 召唤自定义语言

              (document.getElementById("voice-custom") as HTMLElement).onclick = function () {
                console.log("显示自定义语音");
                startSpeakDOM.setAttribute('class', 'speak off');
              }; // 获取语音列表

              const randerVoliceList = (data: any, arg?: any) => {
                console.log("renderVoliceList", data);

                if (data && data.length > 0) {
                  for (let i = 0; i < data.length; i++) {
                    let voiceItem = document.createElement('li');
                    voiceItem.innerHTML = "<li class='voice-item' id='voice-item-" + i + "' data-time=" + (data[i]["duration"] || 20) + " data-url=" + data[i]["fileUrl"] + ">" + (data[i]["voiceName"].length > 10 ? data[i]["voiceName"].substr(0, 10) + "..." : data[i]["voiceName"]) + "</li>";
                    document.getElementsByClassName('voice-list-ul')[0].append(voiceItem); // "<li class='voice-item' id='voice-item-" + i + "' data-time=" + (data[i]["duration"] || 20) + " data-url=" + data[i]["fileUrl"] + ">" + (data[i]["voiceName"].length > 10 ? (data[i]["voiceName"].substr(0, 10) + "...") : data[i]["voiceName"]) + "</li>";
                    // $("#voice-list ul").append("<li class='voice-item' id='voice-item-" + i + "' data-time=" + (data[i]["duration"] || 20) + " data-url=" + data[i]["fileUrl"] + ">" + (data[i]["voiceName"].length > 10 ? (data[i]["voiceName"].substr(0, 10) + "...") : data[i]["voiceName"]) + "</li>");

                    voiceItem.onclick = function (e) {
                      console.log("点击元素", e.target, (e.target as HTMLElement).dataset.url);
                      let voiceUrl = (e.target as HTMLElement).dataset.url;
                      let time = (e.target as HTMLElement).dataset.time;
                      playListOfVoice(voiceUrl, time);
                    };
                  }

                  if (data.length === EZUIKit.state.pageSize) {
                    (document.getElementById('voice-list-end') as HTMLElement).innerHTML = "向下滚动加载更多";
                  } else {
                    (document.getElementById('voice-list-end') as HTMLElement).innerHTML = "没有更多数据了";
                  }
                }
              }

              const fetchVoiceList = (page: any) => {
                function apiSuccess(data: any) {
                  console.log("data", data);

                  if (data.code == 200) {
                    randerVoliceList(data.data, 5);
                    EZUIKit.state.page = data.page.page; // 如果用户语音列表为空

                    if (page == 0 && data.data.length == 0 && !EZUIKit.state.fetchDefaultList) {
                      // 获取用户语音为空
                      EZUIKit.state.fetchDefaultList = true;
                      fetchVoiceList(0);
                    }
                  }
                }

                const apiError = (err: any): any => {
                  console.log("err", err);
                }

                request(DOMAIN + '/api/lapp/voice/query', 'POST', {
                  accessToken: this.opt.accessToken,
                  pageStart: page,
                  pageSize: EZUIKit.state.pageSize,
                  default: EZUIKit.state.fetchDefaultList ? 'true' : 'false'
                }, '', apiSuccess, apiError);
              }

              fetchVoiceList(0);

              const playListOfVoice = (voiceUrl: string | undefined, time: any) => {
                console.log("播放语音", voiceUrl, time); // decoder && decoder.closeSound(0);

                function apiSuccess(data: any) {
                  console.log("data.data", data.data);

                  if (data.code == 200) {
                    // $("#startBroadcast").show();
                    // $("#stopBroadcast").hide();
                    countTime('sub', parseInt(time));
                  } else if (data.code == "10001") {
                    layer.msg("未找到当前语音");
                  } else {
                    layer.msg(data.msg || '发送失败，请稍后再试');
                  } // padding = false;

                }

                function apiError(err: any) {
                  console.log("err", err);
                }

                request(DOMAIN + '/api/lapp/voice/send', 'POST', {
                  accessToken: this.opt.accessToken,
                  deviceSerial: this.opt.deviceSerial,
                  channelNo: this.opt.channelNo,
                  fileUrl: voiceUrl
                }, '', apiSuccess, apiError);
              } // 自定义语音
              // 对讲


              let startSpeakDOM = document.createElement('div');
              let stopSpeakDOM = document.createElement('div');
              startSpeakDOM.setAttribute('class', 'speak off hide');
              stopSpeakDOM.setAttribute('class', 'speak on hide');
              startSpeakDOM.setAttribute('id', 'startSpeak');
              stopSpeakDOM.setAttribute('id', 'stopSpeak');
              startSpeakDOM.innerHTML = '<span title="按住说话">' + '  <svg t="1581994757678" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"' + '    p-id="1639" width="16" height="16">' + '    <path' + '      d="M757.059829 393.846154v-52.512821h262.564103v52.512821H757.059829z m-420.102564 481.367521v96.273504h175.042735a8.752137 8.752137 0 0 1 8.752137 8.752137v35.008547a8.752137 8.752137 0 0 1-8.752137 8.752137H109.401709a8.752137 8.752137 0 0 1-8.752136-8.752137v-35.008547a8.752137 8.752137 0 0 1 8.752136-8.752137h175.042735v-96.273504C129.767932 875.213675 4.376068 749.821812 4.376068 595.145299V463.863248a26.25641 26.25641 0 1 1 52.512821 0v113.777778c0 140.174222 113.637744 253.811966 253.811966 253.811965s253.811966-113.637744 253.811966-253.811965V463.863248a26.25641 26.25641 0 1 1 52.51282 0v131.282051c0 154.676513-125.391863 280.068376-280.068376 280.068376z m-26.25641-96.273504c-111.178393 0-201.299145-90.120752-201.299146-201.299145V201.299145C109.401709 90.120752 199.522462 0 310.700855 0s201.299145 90.120752 201.299145 201.299145v376.341881c0 111.178393-90.120752 201.299145-201.299145 201.299145z m691.418803-280.068376H757.059829v-52.512821h245.059829v52.512821z m-17.504273 105.025641H757.059829v-52.512821h227.555556v52.512821z m-17.504274 105.025641H757.059829v-52.512821h210.051282v52.512821z m-8.752137 105.025641H757.059829v-52.512821h201.299145v52.512821z m-17.504273 105.025641H757.059829v-52.512821h183.794872v52.512821z m-26.25641 105.025641H757.059829v-52.512821h157.538462v52.512821z"' + '      p-id="1640" fill="#ffffff"></path>' + '  </svg>' + '</span>' + '<span>按住说话</span>';
              stopSpeakDOM.innerHTML = '<span title="按住说话">' + '<svg t="1581994757678" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"' + '  p-id="1639" width="16" height="16">' + '  <path' + '    d="M757.059829 393.846154v-52.512821h262.564103v52.512821H757.059829z m-420.102564 481.367521v96.273504h175.042735a8.752137 8.752137 0 0 1 8.752137 8.752137v35.008547a8.752137 8.752137 0 0 1-8.752137 8.752137H109.401709a8.752137 8.752137 0 0 1-8.752136-8.752137v-35.008547a8.752137 8.752137 0 0 1 8.752136-8.752137h175.042735v-96.273504C129.767932 875.213675 4.376068 749.821812 4.376068 595.145299V463.863248a26.25641 26.25641 0 1 1 52.512821 0v113.777778c0 140.174222 113.637744 253.811966 253.811966 253.811965s253.811966-113.637744 253.811966-253.811965V463.863248a26.25641 26.25641 0 1 1 52.51282 0v131.282051c0 154.676513-125.391863 280.068376-280.068376 280.068376z m-26.25641-96.273504c-111.178393 0-201.299145-90.120752-201.299146-201.299145V201.299145C109.401709 90.120752 199.522462 0 310.700855 0s201.299145 90.120752 201.299145 201.299145v376.341881c0 111.178393-90.120752 201.299145-201.299145 201.299145z m691.418803-280.068376H757.059829v-52.512821h245.059829v52.512821z m-17.504273 105.025641H757.059829v-52.512821h227.555556v52.512821z m-17.504274 105.025641H757.059829v-52.512821h210.051282v52.512821z m-8.752137 105.025641H757.059829v-52.512821h201.299145v52.512821z m-17.504273 105.025641H757.059829v-52.512821h183.794872v52.512821z m-26.25641 105.025641H757.059829v-52.512821h157.538462v52.512821z"' + '    p-id="1640" fill="#ff0000"></path>' + '</svg>' + '</span>' + '<span>松开发送</span>';
              footerContainer.appendChild(startSpeakDOM);
              footerContainer.appendChild(stopSpeakDOM);

              (document.getElementById("voice-list") as HTMLElement).onscroll = function (e) {
                let sum = (this as HTMLElement).scrollHeight;
                console.log("sum", sum, (this as HTMLElement).scrollTop, (document.getElementById("voice-list") as HTMLElement).clientHeight);

                if (sum <= (this as HTMLElement).scrollTop + (this as HTMLElement).clientHeight) {
                  console.log("拖动到底，执行加载", EZUIKit.state.page);
                  fetchVoiceList(++EZUIKit.state.page);
                }
              }; // $("#voice-list").unbind("scroll").bind("scroll", function (e) {
              //   // console.log("e",e,this.scrollHeight, $(this).scrollTop() + $(this).height())
              //   let sum = this.scrollHeight;
              //   if (sum <= $(this).scrollTop() + $(this).height()) {
              //     console.log("拖动到底，执行加载", page);
              //     fetchVoiceList(++page);
              //   }
              //   loading = false;
              // });
              // time-area 


              let timeAreaDOM = document.createElement('div');
              timeAreaDOM.setAttribute('class', 'time-area');
              timeAreaDOM.setAttribute('id', 'time-area');
              timeAreaDOM.innerHTML = '00:00';
              footerContainer.appendChild(timeAreaDOM); // 按住说话

              let recorder: any;

              (document.getElementById('startSpeak') as HTMLElement).onmousedown = (event) =>  {
                if (EZUIKit.state.countTimer) {
                  layer.msg("语音设备正忙，请稍后重试");
                  return false;
                }

                console.log("按住说话");
                startSpeakDOM.setAttribute('class', 'speak off hide');
                stopSpeakDOM.setAttribute('class', 'speak on'); // console.log("startRecording",startRecording);
                // startRecording();

                voiceInit();
                countTime('add', 0);
                setTimeout(function () {
                  EZUIKit.state.recodeTime = 0;
                  startRecording();
                }, 1000);

                if (EZUIKit.state.recodeTimer) {
                  // 先清空计数器
                  clearInterval(EZUIKit.state.recodeTimer);
                }

                EZUIKit.state.recodeTimer = setInterval(() => {
                  if (EZUIKit.state.recodeTime >= 59) {
                    this.stopTalk();

                    countTime('destory', 0);
                    (event.target as HTMLElement).setAttribute("class", "ptp-talk on hide");
                    startTalkDOM.setAttribute("class", "ptp-talk off");
                    layer.msg("不超过1分钟");
                  } else {
                    EZUIKit.state.recodeTime = EZUIKit.state.recodeTime + 1;
                  }
                }, 1000);
                /** 录音控制 */

                let audio_context: any;

                function startUserMedia(stream: MediaStream | any) {
                  let input = audio_context.createMediaStreamSource(stream);
                  recorder = new window.Recorder(input);
                }

                function startRecording() {
                  recorder && recorder.record();
                }

                function stopRecording() {
                  recorder && recorder.stop();
                  recorder.clear();
                }

                function voiceInit() {
                  console.log("run init");

                  try {
                    // webkit shim
                    window.AudioContext = window.AudioContext || window.webkitAudioContext;
                    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
                    window.URL = window.URL || window.webkitURL;
                    audio_context = new AudioContext();
                    console.log('Audio context set up.');
                    console.log('navigator.getUserMedia ' + (navigator.getUserMedia as any ? 'available.' : 'not present!'));
                  } catch (e) {
                    console.log("err", e);
                    window.layer.msg('No web audio support in this browser!');
                  }

                  navigator.getUserMedia({
                    audio: true
                  }, startUserMedia, function (e) {
                    console.log('No live audio input: ' + e);
                  });
                }

                ;
              }; // 松开发送


              (document.getElementById('stopSpeak') as HTMLElement).onmouseup = 
              () => {
                console.log("松开发送");
                stopSpeakDOM.setAttribute('class', 'speak on hide');
                stopSpeakFun();

                function stopSpeakFun() {
                  countTime('destory', 0);

                  if (EZUIKit.state.recodeTime < 1) {
                    window.layer.msg("说话时间过短");
                    clearInterval(EZUIKit.state.recodeTimer);
                    return false;
                  }

                  clearInterval(EZUIKit.state.recodeTimer);
                  wavUpload();
                }

                const wavUpload = () => {
                  try {
                    recorder && recorder.stop(); // createAudioDom();

                    recorder && recorder.exportWAV((wav_file: any) => {
                      console.log("wav_file", wav_file);

                      if (wav_file.size < 1000) {
                        window.layer.msg("录音失败，请重试"); // recodeTime = 0;

                        EZUIKit.state.recodeTime = 0;
                        return false;
                      } // 测试


                      countTime('sub', EZUIKit.state.recodeTime + 2); // 延时

                      let formdata = new FormData(); // form 表单 {key:value}

                      formdata.append("voiceFile", wav_file); // form input type="file"

                      formdata.append("accessToken", this.opt.accessToken);
                      formdata.append("deviceSerial", this.opt.deviceSerial);
                      formdata.append("channelNo", this.opt.channelNo); // padding = true;

                      function apiSuccess(data: any) {
                        console.log("data.data", data.data);

                        if (data.code == 200) {
                          // $("#startBroadcast").show();
                          // $("#stopBroadcast").hide();
                          countTime('sub', EZUIKit.state.recodeTime + 2);
                        } else if (data.code == "10001") {
                          window.layer.msg("未找到当前语音");
                        } else {
                          window.layer.msg(data.msg || '发送失败，请稍后再试');
                        } // padding = false;

                      }

                      function apiError(err: any) {
                        console.log("err", err);
                      }

                      request(DOMAIN + '/api/lapp/voice/sendonce', 'POST', {
                        voiceFile: wav_file,
                        accessToken: this.opt.accessToken,
                        deviceSerial: this.opt.deviceSerial,
                        channelNo: this.opt.channelNo
                      }, '', apiSuccess, apiError);
                    });
                    recorder && recorder.clear();
                  } catch (err) {
                    console.log(err);
                  }
                }
              };
            }
            /* 时间计数 */


            const countTime = (type: string, start: any) => {
              clearInterval(EZUIKit.state.countTimer);

              if (type === 'add') {
                let i = start;
                EZUIKit.state.countTimer = setInterval(function () {
                  ++i;
                  (document.getElementById("time-area") as HTMLElement).innerHTML = formatSeconds(i);
                }, 1000);
              } else if (type === 'sub') {
                let i = start;
                EZUIKit.state.countTimer = setInterval(function () {
                  if (i > 0) {
                    i--;
                    (document.getElementById("time-area") as HTMLElement).innerHTML = formatSeconds(i);
                  } else {
                    clearInterval(EZUIKit.state.countTimer);
                    EZUIKit.state.countTimer = undefined;
                    console.log("倒计时结束，开启声音"); // decoder.openSound(0);
                  }
                }, 1000);
              } else if (type === 'destory') {
                clearInterval(EZUIKit.state.countTimer);
                EZUIKit.state.countTimer = undefined;
                (document.getElementById("time-area") as HTMLElement).innerHTML = '00:00';
              } //将秒数转换为时分秒格式


              const formatSeconds = (value: any) => {
                let theTime: number | string = parseInt(value); // 秒

                let middle: number = 0; // 分

                let hour = 0; // 小时

                let secondV: string | number = '00';
                let minV: string | number = '00';
                let hourV: string | number = '00';

                if (theTime > 59) {
                  middle = Math.floor(theTime / 60);
                  theTime = Math.floor(theTime % 60);

                  if (middle > 59) {
                    hour = Math.floor(middle / 60);
                    middle = Math.floor(middle % 60);
                  }
                }

                secondV = Math.floor(theTime) > 9 ? Math.floor(theTime) : '0' + Math.floor(theTime);
                minV = Math.floor(middle) > 9 ? Math.floor(middle) : '0' + Math.floor(middle);
                hourV = Math.floor(hour) > 9 ? Math.floor(hour) : '0' + Math.floor(hour);

                if (hour > 0) {
                  return hourV + ':' + minV + ':' + secondV;
                } else if (middle > 0) {
                  return minV + ':' + secondV;
                } else {
                  return '00:' + secondV;
                }
              }
            }
            /* 将秒数转换为时分秒格式 */


            const formatSeconds = (value: any) => {
              let theTime = parseInt(value); // 秒

              let middle = 0; // 分

              let hour = 0; // 小时

              let secondV: string | number = '00';
              let minV: string | number = '00';
              let hourV: string | number = '00';

              if (theTime > 59) {
                middle = Math.floor(theTime / 60);
                theTime = Math.floor(theTime % 60);

                if (middle > 59) {
                  hour = Math.floor(middle / 60);
                  middle = Math.floor(middle % 60);
                }
              }

              secondV = Math.floor(theTime) > 9 ? Math.floor(theTime) : '0' + Math.floor(theTime);
              minV = Math.floor(middle) > 9 ? Math.floor(middle) : '0' + Math.floor(middle);
              hourV = Math.floor(hour) > 9 ? Math.floor(hour) : '0' + Math.floor(hour);

              if (hour > 0) {
                return hourV + ':' + minV + ':' + secondV;
              } else if (middle > 0) {
                return minV + ':' + secondV;
              } else {
                return '00:' + secondV;
              }
            }
          }
        }
      })
    })

  }

  public play(data: any) {
    let id = 'EZUIKitPlayer-' + this.opt.id;
    let player = (document.getElementById(id) as HTMLIFrameElement).contentWindow;
    if (typeof data === 'object' && data.url) {
      this.opt.url = data.url;
    }

    if (typeof data === 'object' && data.accessToken) {
      this.opt.accessToken = data.accessToken;
    }

    if (typeof data === 'string') {
      this.opt.url = data;
    }
    (player as Window).postMessage({
      action: "play",
      accessToken: this.opt.accessToken,
      url: this.opt.url
    }, DOMAIN + "/ezopen/h5/iframe");
    let _this = this;
    this.opt.videoLoading = true;
    let promise = new Promise(function (resolve, reject) {
      window.addEventListener("message", function (event) {
        let playId = _this.opt.id;
        if (playId == event.data.id && event.data.type === 'handleSuccess') {
          setTimeout(() => {
            _this.opt.videoLoading = false;
          }, 1000)
          resolve(event.data);
        }
      });
    });
    return promise;
  }

  public stop(): Promise<any> {
    return postMessageFromType(this.opt.id, 'stop')
  }
  
  public openSound(arg: number): Promise<any> {
    return postMessageFromType(this.opt.id, 'openSound')
  }

  public closeSound(arg: number): Promise<any> {
    return postMessageFromType(this.opt.id, 'closeSound')
  }

  public startSave(): Promise<any> {
    return postMessageFromType(this.opt.id, 'startSave')
  }

  public stopSave(): Promise<any> {
    return postMessageFromType(this.opt.id, 'stopSave')
  }

  public fullScreen() {
    if (this.opt.fullScreenStatus === 1) {
      return false
    }
    let _this = this;
    let id = 'EZUIKitPlayer-' + this.opt.id;
    let player = (document.getElementById(id) as HTMLIFrameElement).contentWindow;
    if ((navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i))) {
      // console.log('移动端全屏');
      let width = document.documentElement.clientWidth;
      let height = document.documentElement.clientHeight;
      // wrapper = document.getElementById("test"),
      let wrapper = document.body;//document.body 属性返回 <body> 元素， document.documentElement 属性返回 <html> 元素。
      wrapper = document.getElementById(id) as HTMLElement;
      let style = "";
      style += "width:" + height + "px;";// 注意旋转后的宽高切换
      style += "height:" + width + "px;";
      style += "-webkit-transform: rotate(90deg); transform: rotate(90deg);";
      // 注意旋转中点的处理
      style += "-webkit-transform-origin: " + width / 2 + "px " + width / 2 + "px;";
      style += "transform-origin: " + width / 2 + "px " + width / 2 + "px;";
      style += 'position: fixed;top: 0;left: 0;z-index:10';
      wrapper.style.cssText = style;
      let cancelFullDOM = document.createElement('div');
      cancelFullDOM.id = id + "cancel-full-screen"
      let cancelFullDOMStyle = "width:30px;height:" + height + "px;z-index:1000;position:fixed;top:0px;right:0px;";
      cancelFullDOMStyle += "background-image: url(https://resource.ys7cloud.com/group1/M00/00/7E/CtwQE1-01qeAH2wAAAABOliqQ5g167.png);"
      cancelFullDOMStyle += "background-size: contain;background-repeat:no-repeat;background-color:rgba(0,0,0,0.2)";
      (cancelFullDOM as HTMLElement).setAttribute('style', cancelFullDOMStyle);
      cancelFullDOM.onclick = function () {
        _this.cancelFullScreen();
      }
      document.body.appendChild(cancelFullDOM);
      setTimeout(function () {
        (player as Window).postMessage('autoResize', DOMAIN + "/ezopen/h5/iframe")
      }, 200)

    } else {
      // console.log('pc端全屏');
      let requestFullScreen = function (element: any) {
        let requestMethod = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || element.msRequestFullScreen;
        if (requestMethod) {
          requestMethod.call(element);
        } else if (typeof window.ActiveXObject !== "undefined") {
          let wscript = new window.ActiveXObject("WScript.Shell");
          if (wscript !== null) {
            wscript.SendKeys("{F11}");
          }
        }
      }
      requestFullScreen(document.getElementById(id));
      setTimeout(function () {
        (player as Window).postMessage("autoResize", DOMAIN + "/ezopen/h5/iframe")
      }, 200)
    }
    if (this.params.fullScreenCallBack) {
      this.params.fullScreenCallBack(this.opt.id);
    }
    this.opt.fullScreenStatus = 1;
  }

  public cancelFullScreen() {
    if (this.opt.fullScreenStatus === 0) {
      return false
    }
    let id = 'EZUIKitPlayer-' + this.opt.id;
    let player = (document.getElementById(id) as HTMLIFrameElement).contentWindow;
    if ((navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i))) {
      let width = (document.getElementById(id) as HTMLIFrameElement).width;
      let height = (document.getElementById(id) as HTMLIFrameElement).height;
      // wrapper = document.getElementById("test"),
      let wrapper = document.body;//document.body 属性返回 <body> 元素， document.documentElement 属性返回 <html> 元素。
      wrapper = document.getElementById(id) as HTMLElement;
      let style = "";
      style += "width:" + width + "px;";
      style += "height:" + height + "px;";
      style += "-webkit-transform: rotate(0); transform: rotate(0);";
      style += "-webkit-transform-origin: 0 0;";
      style += "transform-origin: 0 0;";
      wrapper.style.cssText = style;
      setTimeout(function () {
        (player as Window).postMessage("autoResize", DOMAIN + "/ezopen/h5/iframe")
      }, 200);
      let cancelFullDOMId = id + "cancel-full-screen";
      let cancelFullDOM = document.getElementById(cancelFullDOMId);
      if (cancelFullDOM) {
        document.body.removeChild(cancelFullDOM)
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitCancelFullScreen) {
        document.webkitCancelFullScreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      }
    }
    if (this.params.cancelFullScreenCallBack) {
      this.params.cancelFullScreenCallBack(this.opt.id);
    }
    this.opt.fullScreenStatus = 0;
  }

  public capturePicture() {
    return postMessageFromType(this.opt.id, 'capturePicture')
  }

  public enableZoom() {
    let id = 'EZUIKitPlayer-' + this.opt.id;
    let player = (document.getElementById(id) as HTMLIFrameElement).contentWindow;
    (player as Window).postMessage("enableZoom", DOMAIN + "/ezopen/h5/iframe");
  }

  public closeZoom() {
    let id = 'EZUIKitPlayer-' + this.opt.id;
    let player = (document.getElementById(id) as HTMLIFrameElement).contentWindow;
    (player as Window).postMessage("closeZoom", DOMAIN + "/ezopen/h5/iframe");
  }

  public getOSDTime() {
    return postMessageFromType(this.opt.id, 'getOSDTime')
  }

  public autoResize() {
    let id = 'EZUIKitPlayer-' + this.opt.id;
    let player = (document.getElementById(id) as HTMLIFrameElement).contentWindow;
    (player as Window).postMessage("autoResize", DOMAIN + "/ezopen/h5/iframe")
  }

  public reSize(width: number, height: number) {
    let id = 'EZUIKitPlayer-' + this.opt.id;
    let player = (document.getElementById(id) as HTMLIFrameElement).contentWindow;
    let containerDOM = document.getElementById(this.opt.id);
    (containerDOM as HTMLElement).style.width = width + 'px';
    (containerDOM as HTMLElement).style.height = height + 'px';

    let playDOM = document.getElementById(id);
    (playDOM as any).setAttribute("width", width);
    (playDOM as any).setAttribute("height", height);

    setTimeout(function () {
      (player as Window).postMessage({
        action: 'autoResize',
      }, DOMAIN + "/ezopen/h5/iframe");
    }, 200)
  }

  public startTalk() {
    console.log("执行开始对讲");
    console.log(this.opt);
    let _this = this;
    EZUIKit.opt = this.opt;
    let apiSuccess = function (data: any) {
      if (data.code == 200) {
        let apiResult = data.data;
        if (apiResult) {
          // 临时将https转换为websocket
          let rtcTrunk = apiResult.rtcUrl;
          if (rtcTrunk.indexOf("ws") === -1) {
            rtcTrunk = rtcTrunk.replace("https", "wss").replace("rtcgw", "rtcgw-ws");
          }
          _this.opt.rtcUrl = rtcTrunk;
          _this.opt.ttsUrl = "tts://" + apiResult.ttsUrl;
          let talk = "talk://" + _this.opt.deviceSerial + ":0:" + _this.opt.channelNo + ":cas.ys7.com:6500";
          _this.opt.talkLink = _this.opt.ttsUrl + "/" + talk;
          _this.opt.stream = apiResult.stream;
          window.startTalk();
        }
      }
    }
    let apiError = function () {
      layer.msg("获取对讲token失败")
    }
    request(_this.opt.apiDomain, 'POST', {
      accessToken: _this.opt.accessToken,
      deviceSerial: _this.opt.deviceSerial,
      channelNo: _this.opt.channelNo
    }, '', apiSuccess, apiError);
  }

  public stopTalk() {
    console.log("执行结束对讲");
    window.stopTalk();
  }

  public async destory(): Promise<any> {
    // remove all child dom
    while (this.domElement.firstChild) {
      this.domElement.removeChild(this.domElement.firstChild)
    }
    return
  }
}

// 加载js
function addJs(filepath: string, callback: () => void) {
  let headerScript = document.getElementsByTagName('head')[0].getElementsByTagName("script");
  let isReady = false;

  for (let i = 0; i < headerScript.length; i++) {
    if (headerScript[i].getAttribute("src") == filepath) {
      isReady = true;
      callback();
    }
  }

  if (!isReady) {
    let oJs = document.createElement("script");
    oJs.setAttribute("src", filepath);
    oJs.onload = callback;
    document.getElementsByTagName("head")[0].appendChild(oJs);
  }
} // 加载css

function addCss(filepath: string, callback: () => void) {
  let headerLink = document.getElementsByTagName('head')[0].getElementsByTagName("link");
  let isReady = false;

  for (let i = 0; i < headerLink.length; i++) {
    if (headerLink[i].getAttribute("href") == filepath) {
      isReady = true;
      callback();
    }
  }

  if (!isReady) {
    let oJs: HTMLLinkElement = document.createElement('link');
    oJs.rel = 'stylesheet';
    oJs.type = 'text/css';
    oJs.href = filepath;
    oJs.onload = callback;
    document.getElementsByTagName("head")[0].appendChild(oJs);
  }
} // 通用请求方法

function request(url: string, method: string, params: any, header: any, success: (arg: any) => void, error: (err?: any) => any) {
  let _url = url;
  let http_request: XMLHttpRequest = new XMLHttpRequest();

  http_request.onreadystatechange = function () {
    if (http_request.readyState == 4) {
      if (http_request.status == 200) {
        let _data = JSON.parse(http_request.responseText);

        success(_data);
      }
    }
  };

  http_request.open(method, _url, true); // http_request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

  let data = new FormData();

  for (let i in params) {
    data.append(i, params[i]);
  }

  http_request.send(data);
}

function postMessageFromType(id: string | undefined, type: any) {
  id = 'EZUIKitPlayer-' + id;
  let player = (document.getElementById(id) as HTMLIFrameElement).contentWindow;
  (player as Window).postMessage(type, DOMAIN + "/ezopen/h5/iframe");
  let promise = new Promise(function (resolve, reject) {
    window.addEventListener("message", function (event) {
      let playId = id;
      if (playId == event.data.id && event.data.type === type) {
        resolve(event.data);
      }
    });
  });
  return promise;
}

EZUIKit.EZUIKitPlayer = EZUIKitPlayer
window.EZUIKit = EZUIKit
