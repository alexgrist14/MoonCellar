import { randomInt } from "node:crypto";
import { Injectable } from "@nestjs/common";
import {
  GameSignalClientMessageSchema,
  type IGameSignalPeer,
  type IGameSignalServerMessage,
} from "@mooncellar/schemas";
import type { WebSocket } from "ws";
import { turnCredentials, turnUrls } from "./signal-turn";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 4;

export type ISignalClient = {
  socket: WebSocket;
  name: string;
  address: string;
  port: number;
  room: ISignalRoom | null;
};

type ISignalRoom = {
  code: string;
  host: ISignalClient;
  guest: ISignalClient | null;
};

@Injectable()
export class SignalService {
  private readonly rooms = new Map<string, ISignalRoom>();
  private readonly turnSecret = process.env.TURN_SECRET ?? "";
  private readonly turnUrls = turnUrls(process.env.TURN_URLS);

  get roomCount() {
    return this.rooms.size;
  }

  private send(client: ISignalClient, message: IGameSignalServerMessage) {
    if (client.socket.readyState === client.socket.OPEN) {
      client.socket.send(JSON.stringify(message));
    }
  }

  private peerOf(client: ISignalClient): IGameSignalPeer {
    return { name: client.name, address: client.address, port: client.port };
  }

  private turn(room: ISignalRoom) {
    if (!this.turnSecret || this.turnUrls.length === 0) return undefined;
    return turnCredentials(this.turnSecret, this.turnUrls, room.code, Date.now());
  }

  private newCode() {
    for (;;) {
      const code = Array.from(
        { length: CODE_LENGTH },
        () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]
      ).join("");
      if (!this.rooms.has(code)) return code;
    }
  }

  handleMessage(client: ISignalClient, raw: string) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return this.send(client, {
        type: "error",
        message: "Messages must be JSON",
      });
    }
    const result = GameSignalClientMessageSchema.safeParse(parsed);
    if (!result.success) {
      return this.send(client, {
        type: "error",
        message: "Unknown or malformed message",
      });
    }
    const message = result.data;

    if (message.type === "host") {
      this.leave(client);
      client.port = message.port;
      const room: ISignalRoom = {
        code: this.newCode(),
        host: client,
        guest: null,
      };
      this.rooms.set(room.code, room);
      client.room = room;
      return this.send(client, {
        type: "hosted",
        code: room.code,
        turn: this.turn(room),
      });
    }

    if (message.type === "join") {
      this.leave(client);
      const room = this.rooms.get(message.code.toUpperCase());
      if (!room) {
        return this.send(client, {
          type: "error",
          message: "No game with this code. Check it with the host",
        });
      }
      if (room.guest) {
        return this.send(client, {
          type: "error",
          message: "This game already has two players",
        });
      }
      client.port = message.port;
      room.guest = client;
      client.room = room;
      const turn = this.turn(room);
      this.send(client, {
        type: "joined",
        code: room.code,
        peer: this.peerOf(room.host),
        turn,
      });
      return this.send(room.host, {
        type: "peer",
        peer: this.peerOf(client),
        turn,
      });
    }

    if (message.type === "signal") {
      const room = client.room;
      const other = room && (room.host === client ? room.guest : room.host);
      if (!other) {
        return this.send(client, {
          type: "error",
          message: "Nobody to send this to yet",
        });
      }
      return this.send(other, { type: "signal", data: message.data });
    }

    this.leave(client);
  }

  leave(client: ISignalClient) {
    const room = client.room;
    if (!room) return;
    client.room = null;
    if (room.host === client) {
      this.rooms.delete(room.code);
      if (room.guest) {
        room.guest.room = null;
        this.send(room.guest, { type: "closed" });
      }
    } else {
      room.guest = null;
      this.send(room.host, { type: "left" });
    }
  }
}
