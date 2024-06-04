import "../lib/shared/styles/_reset.scss";
import "../lib/shared/styles/_common.scss";
import { Provider } from "react-redux";
import { persistor, store } from "../lib/app/store";
import { AppProps } from "next/app";
import { Layout } from "../lib/app/ui/Layout";
import { PersistGate } from "redux-persist/integration/react";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </PersistGate>
    </Provider>
  );
}
