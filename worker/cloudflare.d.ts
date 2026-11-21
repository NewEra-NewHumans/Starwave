declare module 'cloudflare:workers' {
  export class DurableObject<Env = unknown> {
    protected ctx: DurableObjectState;
    protected env: Env;
    constructor(ctx: DurableObjectState, env: Env);
  }
}

interface DurableObjectState {
  acceptWebSocket(ws: WebSocket, tags?: string[]): void;
  getWebSockets(tag?: string): WebSocket[];
  setWebSocketAutoResponse(pair: unknown): void;
}

interface DurableObjectId {
  toString(): string;
}

interface DurableObjectStub {
  fetch(input: Request | string, init?: RequestInit): Promise<Response>;
}

interface DurableObjectNamespace {
  idFromName(name: string): DurableObjectId;
  get(id: DurableObjectId): DurableObjectStub;
}

interface CloudflareFetcher {
  fetch(input: Request | string, init?: RequestInit): Promise<Response>;
}

interface CloudflareWebSocket extends WebSocket {
  accept(): void;
  serializeAttachment(attachment: unknown): void;
  deserializeAttachment(): unknown;
}

declare var WebSocketPair: {
  new (): { 0: CloudflareWebSocket; 1: CloudflareWebSocket };
};

interface ResponseInit {
  webSocket?: WebSocket;
}
