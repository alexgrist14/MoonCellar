export type YandexMetrikaInitParameters = {
  accurateTrackBounce?: boolean | number;
  childIframe?: boolean;
  clickmap?: boolean;
  defer?: boolean;
  ecommerce?: boolean | string | [];
  params?: unknown | [];
  userParams?: unknown;
  trackHash?: boolean;
  trackLinks?: boolean;
  trustedDomains?: string[];
  type?: number;
  webvisor?: boolean;
  triggerEvent?: boolean;
  sendTitle?: boolean;
  ssr?: boolean;
};

export type YandexMetrikaHitOptions = {
  callback: () => void;
  ctx: unknown;
  params: YandexMetrikaHitParams;
  referer: string;
  title: string;
};

export type YandexMetrikaHitParams = {
  order_price: number;
  currency: string;
};

export type YandexMetrikaMethod =
  | 'init'
  | 'hit'
  | 'addFileExtension'
  | 'extLink'
  | 'file'
  | 'firstPartyParams'
  | 'firstPartyParamsHashed'
  | 'getClientID'
  | 'notBounce'
  | 'params'
  | 'reachGoal'
  | 'setUserID'
  | 'userParams';
