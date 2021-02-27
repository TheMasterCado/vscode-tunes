export const __prod__ = process.env.NODE_ENV === "production";
export const apiBaseUrl = __prod__ ? "https://xxxx" : "http://localhost:3002";
export const apiWsUrl = __prod__
  ? "wss://xxxx/realtime"
  : "ws://localhost:3002/realtime";
