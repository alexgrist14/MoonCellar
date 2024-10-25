import "../lib/shared/styles/_reset.scss";
import "../lib/shared/styles/_common.scss";
import { AppProps } from "next/app";
import { Layout } from "../lib/app/ui/Layout";
import { ToastConnector } from "../lib/shared/ui/Toast";
import { ModalsConnector } from "../lib/shared/ui/Modal";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div>
      <Layout>
        <Component {...pageProps} />
      </Layout>
      <ToastConnector />
      <ModalsConnector />
    </div>
  );
}
