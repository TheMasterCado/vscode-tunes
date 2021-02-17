import SpotifyWebApi from "spotify-web-api-node";
import { ExtensionState } from "./ExtensionState";
import { refreshSpotifyAccessToken } from "./vscodeTunesApi";
import * as vscode from "vscode";

const getSpotifyApi = async () => {
  const spotifyApi = new SpotifyWebApi();
  let accessToken = ExtensionState.getSpotifyAccessToken();
  if (!accessToken) {
    accessToken = await refreshSpotifyAccessToken();
  }
  spotifyApi.setAccessToken(accessToken);
  return spotifyApi;
};

export const getCurrentlyPlaying = async () => {
  const spotifyApi = await getSpotifyApi();

  const response = await spotifyApi.getMyCurrentPlayingTrack();
  const song = response.body.item;
  if (song) {
    return {
      name: `${song.name} - ${song.artists.map((a) => a.name).join(", ")}`,
      uri: song.uri,
    };
  } else {
    return null;
  }
};

export const startPlayingUri = async (uri: string) => {
  const spotifyApi = await getSpotifyApi();

  await spotifyApi.play({ uris: [uri] });
};
