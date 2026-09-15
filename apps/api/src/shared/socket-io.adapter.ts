import { IoAdapter } from "@nestjs/platform-socket.io";
import type { ServerOptions } from "socket.io";
import { getCorsOrigins } from "./cors";

export class SocketIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: ServerOptions) {
    return super.createIOServer(port, {
      ...options,
      cors: {
        credentials: true,
        origin: (
          origin: string | undefined,
          callback: (error: Error | null, isAllowed?: boolean) => void
        ) => callback(null, !!origin && getCorsOrigins().includes(origin)),
      },
    });
  }
}
