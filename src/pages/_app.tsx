import { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { Layout } from "../lib/app/ui/Layout";
import { useCommonStore } from "../lib/shared/store/common.store";
import "../lib/shared/styles/_common.scss";
import "../lib/shared/styles/_reset.scss";
import { ModalsConnector } from "../lib/shared/ui/Modal";
import { ToastConnector } from "../lib/shared/ui/Toast";

export default function App({ Component, pageProps }: AppProps) {
  const { asPath } = useRouter();
  const { setWinner } = useCommonStore();

  useEffect(() => {
    setWinner(undefined);
  }, [asPath, setWinner]);

  return (
    <>
      <Head>
        <title>MoonCellar</title>
        <meta name="description" content="Your games cellar" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/images/favicon.png" />
      </Head>
      <Layout>
        <Component {...pageProps} />
        <ToastConnector />
        <ModalsConnector />
      </Layout>
    </>
  );
}
