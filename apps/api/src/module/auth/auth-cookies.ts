import { type CookieOptions, type Response } from "express";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../shared/constants";

export const getAuthCookieOptions = (origin?: string): CookieOptions => {
  const isLocalhost = !!origin?.includes("localhost");
  const secure = !!origin?.includes("https");

  return {
    httpOnly: true,
    domain: isLocalhost ? ".localhost" : "mooncellar.space",
    secure,
    sameSite: isLocalhost || !secure ? undefined : "none",
  };
};

export const clearAuthCookies = (res: Response, origin?: string): void => {
  const options = getAuthCookieOptions(origin);

  res.clearCookie(ACCESS_TOKEN, options);
  res.clearCookie(REFRESH_TOKEN, options);
};
