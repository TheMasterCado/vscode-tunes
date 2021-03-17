export const __prod__ = process.env.NODE_ENV === "production";
export const apiBaseUrl = __prod__
  ? "https://vscodetunes.themastercado.com"
  : "http://localhost:3002";
export const apiWsUrl = __prod__
  ? "wss://vscodetunes.themastercado.com/realtime"
  : "ws://localhost:3002/realtime";
