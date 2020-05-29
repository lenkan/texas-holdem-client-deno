import {
  compileMessage,
  IncomingMessage,
  OutgoingMessage,
  parseMessage,
} from "./protocol.ts";
import {
  BufReader,
} from "https://deno.land/std@v0.53.0/io/bufio.ts";

const decoder = new TextDecoder();
const encoder = new TextEncoder();

export function createReader(
  conn: Deno.Reader,
  delim: string,
): () => Promise<any | null> {
  const reader = BufReader.create(conn);
  let buffer: string = "";

  return async () => {
    while (true) {
      const index = buffer.indexOf(delim);

      if (index !== -1) {
        const chunk = buffer.substring(0, index);
        buffer = buffer.substring(index + delim.length);
        return chunk;
      }

      const p = new Uint8Array(1024);
      const n = await reader.read(p);
      if (n === null) {
        return null;
      }

      buffer += decoder.decode(p.slice(0, n));
    }
  };
}

export function createWriter(
  conn: Deno.Writer,
  delim: string,
): (value: string) => Promise<void> {
  return async (value: string) => {
    await conn.write(encoder.encode(value + delim));
  };
}

export interface PokerSocketOptions {
  hostname: string;
  port: number;
}

export interface PokerSocket {
  write(event: OutgoingMessage): Promise<void>;
  read(): Promise<IncomingMessage | null>;
  close(): void;
}

const jsonDelimiter = "_-^emil^-_";

export async function connect(
  options: PokerSocketOptions,
): Promise<PokerSocket> {
  const conn = await Deno.connect(
    { hostname: options.hostname, port: options.port },
  );

  const writer = createWriter(conn, jsonDelimiter);
  const reader = createReader(conn, jsonDelimiter);

  async function write(message: OutgoingMessage) {
    await writer(compileMessage(message));
  }

  async function read(): Promise<IncomingMessage | null> {
    const m = await reader();
    if (m !== null) {
      return parseMessage(m);
    }

    return null;
  }

  return {
    read,
    write,
    close: conn.close.bind(conn),
  };
}
