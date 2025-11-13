'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { FC, useEffect } from 'react';
import useYandexMetrika from './useYandexMetrika';
import { YandexMetrikaInitializer } from './YandexMetrikaInitializer';

export const YandexMetrikaContainer: FC<{ disabled?: boolean }> = ({
  disabled,
}) => {
  const pathname = usePathname();
  const search = useSearchParams();
  const id = Number(process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID || -1);

  const { hit } = useYandexMetrika(id, disabled);

  useEffect(() => {
    if (id === -1) return;

    hit(`${pathname}${search.size ? `?${search}` : ''}${window.location.hash}`);
  }, [hit, pathname, search, id]);

  if (disabled || id === -1) return null;

  return (
    <YandexMetrikaInitializer
      id={id}
      initParameters={{
        webvisor: true,
        clickmap: true,
        ecommerce: 'dataLayer',
        accurateTrackBounce: true,
        trackLinks: true,
      }}
    />
  );
};
