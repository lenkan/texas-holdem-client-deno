import { createSocket, PokerSocket } from "./socket.ts";
import {
  handleActions,
  register,
  PokerRoom,
  RequestHandler,
} from "./client.ts";
import { Table } from "./table.ts";

export { RequestHandler, PokerRoom };

export interface PokerOptions {
  /**
   * Defaults to "localhost"
   */
  hostname?: string;

  /**
   * Defaults to 4711
   */
  port?: number;

  /**
   * Defaults to 'TRAINING'
   */
  room?: PokerRoom;
  name: string;
}

export interface PokerClient {
  start(handler: RequestHandler): Promise<void>;
}

export async function start(
  options: PokerOptions,
  handler: RequestHandler,
): Promise<Table> {
  const conn = await Deno.connect(
    { hostname: options.hostname || "localhost", port: options.port || 4711 },
  );

  const socket = createSocket(conn);

  await register(socket, {
    name: options.name,
    room: options.room || "TRAINING",
  });

  const result = await handleActions(socket, handler, options);

  return result;
}
