import Head from "next/head";
import { HomePage } from "../lib/pages/HomePage";

export default function Home() {
  return (
    <>
      <Head>
        <title>MoonCellar</title>
        <meta name="description" content="Gaming Paradise" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <HomePage />
    </>
  );
}
