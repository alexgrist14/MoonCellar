'use client';

import Script from 'next/script';
import React from 'react';
import { YandexMetrikaInitParameters } from './yandex-metrika.type';

type Props = {
  id: number;
  initParameters: YandexMetrikaInitParameters;
};

export const YandexMetrikaInitializer: React.FC<Props> = ({
  id,
  initParameters,
}) => {
  /* eslint-disable @next/next/no-img-element */
  return (
    <>
      <Script
        type="text/javascript"
        id={`ym_${id}`}
        strategy="afterInteractive"
      >
        {`(function (m, e, t, r, i, k, a) {
          m[i] =
            m[i] ||
            function () {
              (m[i].a = m[i].a || []).push(arguments);
            };
          m[i].l = 1 * new Date();
          for (var j = 0; j < document.scripts.length; j++) {
            if (document.scripts[j].src === r) {
              return;
            }
          }
          (k = e.createElement(t)),
            (a = e.getElementsByTagName(t)[0]),
            (k.async = 1),
            (k.src = r),
            a.parentNode.insertBefore(k, a);
        })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

        ym(${id}, "init", ${JSON.stringify(initParameters)});`}
      </Script>
      <noscript>
        <div>
          <img
            src={`https://mc.yandex.ru/watch/${id}`}
            style={{ position: 'absolute', left: '-9999px;' }}
            alt=""
          />
        </div>
      </noscript>
    </>
  );
};
