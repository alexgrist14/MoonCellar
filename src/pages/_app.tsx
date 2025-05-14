import { AppProps } from "next/app";
import Head from "next/head";
import { Layout } from "../lib/app/ui/Layout";
import "../lib/shared/styles/_common.scss";
import "../lib/shared/styles/_reset.scss";
import localFont from "next/font/local";
import classNames from "classnames";

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

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>MoonCellar</title>
        <meta name="description" content="Games tracker and database" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/images/mooncellar.ico" />
      </Head>
      <Layout className={classNames(general.variable, pentagra.variable)}>
        <Component {...pageProps} />
      </Layout>
    </>
  );
}
