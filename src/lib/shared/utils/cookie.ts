export function getCookie(name: string) {
  const matches = document.cookie.match(
    new RegExp(
      '(?:^|; )' +
        name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') +
        '=([^;]*)',
    ),
  );
  const res = matches ? decodeURIComponent(matches[1]) : undefined;

  if (typeof res === 'string') return res;
  if (typeof res === 'object') return JSON.parse(res);
}

export function setCookie(
  name: string,
  value: object | string,
  options: {
    path?: string;
    'max-age'?: number;
    domain?: string;
    secure?: boolean;
  } = {},
) {
  options = {
    path: '/',
    'max-age': 86400,
    ...options,
  };

  if (typeof value !== 'string') value = JSON.stringify(value);

  let updatedCookie =
    encodeURIComponent(name) + '=' + encodeURIComponent(value);

  for (const optionKey in options) {
    updatedCookie += '; ' + optionKey;

    const optionValue = options[optionKey];
    if (optionValue !== true) {
      updatedCookie += '=' + optionValue;
    }
  }
  if (!document) return;
  document.cookie = updatedCookie;
}

export function deleteCookie(
  name: string,
  options: {
    domain?: string;
  } = {},
) {
  setCookie(name, '', {
    'max-age': -1,
    ...options,
  });
}
