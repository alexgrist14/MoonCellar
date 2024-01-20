import ReactDOM from "react-dom/client";
import "./index.css";
import Main from "./components/Main/Main";
import { Provider } from "react-redux";
import { store } from "./store";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <Provider store={store}>
      <Main />
  </Provider>
);
