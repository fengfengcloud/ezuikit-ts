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
  height?: Number | string;
  width?: Number | string;
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
}

type Header = 'capturePicture' | 'save' | 'zoom'

type Footer = 'talk' | 'broadcast' | 'hd' | 'fullScreen'