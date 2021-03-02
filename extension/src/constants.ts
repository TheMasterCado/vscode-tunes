export const __prod__ = process.env.NODE_ENV === "production";
export const apiBaseUrl = __prod__
  ? "http://97.107.135.55"
  : "http://localhost:3002";
export const apiWsUrl = __prod__
  ? "ws://97.107.135.55/realtime"
  : "ws://localhost:3002/realtime";
