import { webcrypto as nodeCrypto } from "node:crypto";

if (!globalThis.crypto) {
  globalThis.crypto = nodeCrypto as unknown as Crypto;
}

if (typeof globalThis.btoa === "undefined") {
  globalThis.btoa = (data: string) =>
    Buffer.from(data, "binary").toString("base64");
}

if (typeof globalThis.atob === "undefined") {
  globalThis.atob = (data: string) =>
    Buffer.from(data, "base64").toString("binary");
}
