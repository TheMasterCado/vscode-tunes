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

const formatCurrentlyPlaying = (
  responseBody: SpotifyApi.CurrentlyPlayingResponse
) => {
  const song = responseBody.item;
  if (song) {
    return {
      name: `${song.name} - ${song.artists.map((a) => a.name).join(", ")}`,
      uri: song.uri,
      isPlaying: responseBody.is_playing,
    };
  } else {
    return null;
  }
};

export const getCurrentlyPlaying = async () => {
  const spotifyApi = await getSpotifyApi();

  const response = await spotifyApi.getMyCurrentPlayingTrack();
  return formatCurrentlyPlaying(response.body);
};

export const startPlayingUri = async (uri: string) => {
  const spotifyApi = await getSpotifyApi();

  try {
    await spotifyApi.play({ uris: [uri] });
  } catch (err) {
    throw new SpotifyError("Cannot play this, maybe it's not a real track");
  }
};

export const togglePlayback = async () => {
  const spotifyApi = await getSpotifyApi();

  const playback = await spotifyApi.getMyCurrentPlayingTrack();
  if (playback.body.is_playing) {
    await spotifyApi.pause();
  } else {
    await spotifyApi.play();
  }
  playback.body.is_playing = !playback.body.is_playing;
  return formatCurrentlyPlaying(playback.body);
};

export class SpotifyError extends Error {}
