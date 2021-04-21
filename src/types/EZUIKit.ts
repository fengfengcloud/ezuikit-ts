import { Params } from './parmas';

export interface EZUIKit {
  EZUIKitPlayer: any;
  EZUIKitTalk: any;
  opt: Options;
  state: {
    countTimer: any;
    recodeTime: number;
    recodeTimer: number | undefined | any;
    fetchDefaultList: boolean;
    page: number;
    pageSize: number;
  },
  params: Params;
  handleTalkSuccess(): void;
  handleTalkError(): void;
}

export interface Options {
  apiDomain: string;
  talkLink?: string;
  filePath?: string;
  accessToken: string;
  url: string;
  deviceSerial?: any;
  id: string;
  channelNo?: any;
  talLink?: string;
  rtcUrl?: string;
  ttsUrl?: string;
  stream?: string;
  isReliesReady?: boolean;
  template?: Template;
  plugin?: string[];
  audio?: number;
  autoplay?: number;
  fullScreenStatus?: number;
  bSupporDoubleClickFull?: boolean;
  videoLoading?: boolean;
}

export type Template = 'simple' | 'standard' | 'security' | 'voice'