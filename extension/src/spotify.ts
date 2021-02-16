import SpotifyWebApi from "spotify-web-api-node";
import { ExtensionState } from "./ExtensionState";
import { refreshSpotifyAccessToken } from "./vscodeTunesApi";

export const getCurrentlyPlaying = async () => {
  const spotifyApi = new SpotifyWebApi();
  let accessToken = ExtensionState.getSpotifyAccessToken();
  if (!accessToken) {
    accessToken = await refreshSpotifyAccessToken();
  }
  spotifyApi.setAccessToken(accessToken);

  const response = await spotifyApi.getMyCurrentPlayingTrack();
  return response.body.item?.name;
};
