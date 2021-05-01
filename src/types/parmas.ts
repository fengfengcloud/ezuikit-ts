import { Options } from './EZUIKit';

export interface Params extends Options {
  env?: {
    domain: string;
    filePathDomain: string;
  };
  bSupporDoubleClickFull?: any;
  handleTalkSuccess?: any;
  controls?: any;
  websocketParams?: any;
  height?: number | string;
  width?: number | string;
  header?: Header[];
  footer?: Footer[];
  handleTalkError(): any;
  openSoundCallBack(): any;
  closeSoundCallBack(): any;
  capturePictureCallBack(): any;
  startSaveCallBack(): any;
  stopSaveCallBack(): any;
  fullScreenCallBack(arg: any): any;
  cancelFullScreenCallBack(arg: any): any;
  getOSDTimeCallBack(): any;
  handleSuccess(): any;
  handleError(err?: any): any;
  onHistroyCallBack(): any;
}

type Header = 'capturePicture' | 'save' | 'zoom' | 'fullScreen' | 'history'

type Footer = 'talk' | 'broadcast' | 'hd' | 'fullScreen'