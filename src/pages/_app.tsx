import "../lib/shared/styles/_reset.scss";
import "../lib/shared/styles/_common.scss";
import { AppProps } from "next/app";
import { Layout } from "../lib/app/ui/Layout";
import { ToastConnector } from "../lib/shared/ui/Toast";
import { ModalsConnector } from "../lib/shared/ui/Modal";
import "rsuite/dist/rsuite-no-reset.min.css";
import { CustomProvider } from "rsuite";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <CustomProvider>
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
    </CustomProvider>
  );
}
