import {
  YandexMetrikaHitOptions,
  YandexMetrikaMethod,
} from './yandex-metrika.type';

declare const ym: (
  id: number,
  method: YandexMetrikaMethod,
  ...params: unknown[]
) => void;

const useYandexMetrika = (id: number, disabled?: boolean) => {
  const hit = (url?: string, options?: YandexMetrikaHitOptions) => {
    if (!disabled) {
      ym(id, 'hit', url, options);
    } else {
      // devLog(['YandexMetrika (hit)', url]);
    }
  };

  const reachGoal = (
    target: string,
    params?: unknown,
    callback?: () => void,
    ctx?: unknown,
  ) => {
    if (!disabled) {
      ym(id, 'reachGoal', target, params, callback, ctx);
    } else {
      // devLog(['YandexMetrika (reachGoal)', target]);
    }
  };

  return { hit, reachGoal };
};

export default useYandexMetrika;
