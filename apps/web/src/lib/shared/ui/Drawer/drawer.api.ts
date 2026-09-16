import EventEmitter from "events";
import { IDrawer } from "./Drawer.types";

export const drawerEvents = new EventEmitter();

export const DRAWER_TRIGGER_ATTRIBUTE = "data-drawer-trigger";

export const drawer: IDrawer = {
  open: (component, params) => {
    drawerEvents.emit("open", { component, params: params ?? {} });
  },
  close: () => {
    drawerEvents.emit("close");
  },
};
