export const getCookie = (name: string) => {
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
};
