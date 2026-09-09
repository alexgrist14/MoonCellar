export function setCookie(
  name: string,
  value: object | string,
  options: any = {}
) {
  options = {
    path: "/",
    "max-age": 24 * 60 * 60,
    secure: true,
    ...options,
  };

  if (typeof value !== "string") value = JSON.stringify(value);

  let updatedCookie =
    encodeURIComponent(name) + "=" + encodeURIComponent(value);

  for (const optionKey in options) {
    updatedCookie += "; " + optionKey;

    const optionValue = options[optionKey];
    if (optionValue !== true) {
      updatedCookie += "=" + optionValue;
    }
  }
  if (typeof window === "undefined" || !document) return;
  document.cookie = updatedCookie;
}

export function deleteCookie(name: string) {
  setCookie(name, "", {
    "max-age": -1,
  });
}
