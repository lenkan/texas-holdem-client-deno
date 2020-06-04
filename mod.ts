import {
  PokerRoom,
  RequestHandler,
  PokerClient,
  Table,
  Card,
  Action,
  ActionRequest,
  Hand,
  Suit,
  PokerClientOptions,
} from "./client.ts";

export {
  RequestHandler,
  PokerRoom,
  Table,
  PokerClient,
  PokerClientOptions,
  Action,
  Card,
  ActionRequest,
  Hand,
  Suit
};

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

  /**
   * Name of the bot
   */
  name: string;
}

export async function start(
  options: PokerOptions,
  handler: RequestHandler,
): Promise<Table> {
  const conn = await Deno.connect(
    { hostname: options.hostname || "localhost", port: options.port || 4711 },
  );

  const client = new PokerClient(conn, {
    name: options.name,
    room: options.room || "TRAINING",
  });

  await client.register();

  return client.start(handler);
}
