import { type CookieOptions } from "express";

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
