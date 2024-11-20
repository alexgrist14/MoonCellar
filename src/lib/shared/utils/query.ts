import { NextRouter } from "next/router";

const addQuery = (router: NextRouter) => {
  const { query, push, asPath } = router;
  return push({ pathname: asPath, query }, undefined, { shallow: true });
};
