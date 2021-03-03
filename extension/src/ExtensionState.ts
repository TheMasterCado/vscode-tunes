import * as vscode from "vscode";

const ACCESS_TOKEN_KEY = "vscodetunesaccesstoken";
const SPOTIFY_REFRESH_TOKEN_KEY = "vscodetunesspotifyrefreshtoken";

export class ExtensionState {
  static state: vscode.Memento;

  // We don't store this access token because it is short lived
  // and we always get another one using the refresh token
  private static spotifyAccessToken: string | undefined;

  static setAccessToken(token: string) {
    return this.state.update(ACCESS_TOKEN_KEY, token);
  }

  static getAccessToken(): string | undefined {
    return this.state.get(ACCESS_TOKEN_KEY);
  }

  static setSpotifyTokens(
    accessToken: string,
    refreshToken?: string | undefined
  ) {
    this.spotifyAccessToken = accessToken;
    if (refreshToken !== undefined) {
      return this.state.update(SPOTIFY_REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  static getSpotifyRefreshToken(): string | undefined {
    return this.state.get(SPOTIFY_REFRESH_TOKEN_KEY);
  }

  static getSpotifyAccessToken(): string | undefined {
    return this.spotifyAccessToken;
  }

  static async reset() {
    this.spotifyAccessToken = undefined;
    await this.state.update(SPOTIFY_REFRESH_TOKEN_KEY, undefined);
    await this.state.update(ACCESS_TOKEN_KEY, undefined);
  }
}
