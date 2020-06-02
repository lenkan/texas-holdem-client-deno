import { PokerClient } from "./client.ts";
import { mock, assertEquals } from "./testing.ts";
import { IncomingMessage, OutgoingMessage } from "./protocol.ts";

function createConn() {
  const conn = mock.obj<Deno.Conn>({
    close: mock.fn(),
    closeWrite: mock.fn(),
    read: mock.fn(),
    write: mock.fn(async (arr: Uint8Array) => {
      return arr.length;
    }),
    rid: 0,
    localAddr: {} as any,
    remoteAddr: {} as any,
  });
  return conn;
}

function decode(arr: Uint8Array) {
  return new TextDecoder().decode(arr);
}

function encode(str: string) {
  return new TextEncoder().encode(str);
}

const jsonDelimiter = "_-^emil^-_";

interface PokerFrame extends Record<string, unknown> {
  type: string;
}

function createType(namespace: string, type: string) {
  return `se.cygni.texasholdem.communication.message.${namespace}.${type}`;
}

function createMockReader(messages: PokerFrame[]) {
  const data = encode(
    messages.map((x) => JSON.stringify(x)).join(jsonDelimiter) + jsonDelimiter,
  );

  let offset = 0;

  return (p: Uint8Array): Promise<number | null> => {
    const size = Math.min(p.length, data.length - offset);
    if (size === 0) {
      return Promise.resolve(null);
    }

    const slice = data.slice(offset, offset + size);
    p.set(slice);
    offset += size;

    return Promise.resolve(slice.length);
  };
}

Deno.test("register - handle register handshake", async () => {
  const conn = createConn();
  const client = new PokerClient(conn, { name: "my_bot" });

  conn.read.mock.setImplementation(createMockReader([
    {
      type: createType("request", "RegisterForPlayResponse"),
    },
  ]));

  await client.register();

  const args = decode(conn.write.mock.calls[0][0]).replace(jsonDelimiter, "");
  const actual = JSON.parse(args);

  assertEquals(
    actual.type,
    createType("request", "RegisterForPlayRequest"),
  );
  assertEquals(actual.name, "my_bot");
  assertEquals(actual.room, "TRAINING");
  assertEquals(actual.sessionId, "");
  assertEquals(typeof actual.requestId, "string");
});

Deno.test("start - reads message", async () => {
  const conn = createConn();
  const client = new PokerClient(conn, { name: "my_bot" });

  conn.read.mock.setImplementation(createMockReader([
    {
      type: createType("event", "PlayIsStartedEvent"),
      players: [
        { name: "p1", chipCount: 10 },
        { name: "p2", chipCount: 12 },
      ],
      dealer: "p1",
      tableId: 123,
    },
    {
      type: createType("request", "ActionRequest"),
      possibleActions: [
        {
          actionType: "FOLD",
          amount: 0,
        },
      ],
    },
  ]));

  const result = await client.start((req) => {
    return req.foldAction;
  });

  assertEquals(result.id, 123);
  assertEquals(result.players[0].name, "p1");
});
