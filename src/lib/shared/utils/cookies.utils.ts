import { ACCESS_TOKEN } from "../constants";

export function getCookie(name: string) {
  const matches = document.cookie.match(
    new RegExp(
      "(?:^|; )" +
        name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") +
        "=([^;]*)"
    )
  );
  const res = matches ? decodeURIComponent(matches[1]) : undefined;

  if (typeof res === "string") return res;
  if (typeof res === "object") return JSON.parse(res);
}

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

export function getAccesToken() {
  if (typeof window === "undefined") return null;
  const token = getCookie(ACCESS_TOKEN);
  if (token) return token;
  else return localStorage.getItem(ACCESS_TOKEN);
}

export function setAccesToken(token: string) {
  if (typeof window === "undefined") return;
  setCookie(ACCESS_TOKEN, token);
  localStorage.setItem(ACCESS_TOKEN, token);
}

export function deleteAccesToken() {
  if (typeof window === "undefined") return;
  deleteCookie(ACCESS_TOKEN);
  localStorage.removeItem(ACCESS_TOKEN);
}
