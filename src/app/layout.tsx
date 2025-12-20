import { Layout } from "../lib/app/ui/Layout";
import localFont from "next/font/local";
import classNames from "classnames";
import { ReactNode } from "react";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../lib/shared/constants";
import { cookies } from "next/headers";
import { polyfill } from "interweave-ssr";
import "@/src/lib/app/styles/reset.scss";

const general = localFont({
  variable: "--font-general",
  src: [
    {
      path: "./ApercuPro.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./ApercuPro-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./ApercuPro-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
});

const pentagra = localFont({
  variable: "--font-pentagra",
  src: [
    {
      path: "./Pentagra.ttf",
      weight: "400",
      style: "normal",
    },
  ],
});
polyfill();

export default async function App({ children }: { children: ReactNode }) {
  const cookie = await cookies();

  const accessToken = cookie.get(ACCESS_TOKEN);
  const refreshToken = cookie.get(REFRESH_TOKEN);

  return (
    <html>
      <head>
        <title>MoonCellar</title>
        <meta name="description" content="Games tracker and database" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/images/mooncellar.ico" />
      </head>
      <body style={{ color: "white", background: "#191d24" }}>
        <Layout
          className={classNames(general.variable, pentagra.variable)}
          accessToken={accessToken}
          refreshToken={refreshToken}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}
