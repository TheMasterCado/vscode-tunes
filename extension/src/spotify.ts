import SpotifyWebApi from "spotify-web-api-node";
import { ExtensionState } from "./ExtensionState";
import { refreshSpotifyAccessToken } from "./vscodeTunesApi";

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

export const getCurrentlyPlaying = async (
  isRefreshTokenRun = false
): Promise<any> => {
  const spotifyApi = await getSpotifyApi();

  try {
    const response = await spotifyApi.getMyCurrentPlayingTrack();
    return formatCurrentlyPlaying(response.body);
  } catch (err) {
    if (err.statusCode === 401 && !isRefreshTokenRun) {
      ExtensionState.setSpotifyTokens("");
      return await getCurrentlyPlaying(true);
    }
  }
};

export const startPlayingUri = async (
  uri: string,
  isRefreshTokenRun = false
): Promise<void> => {
  const spotifyApi = await getSpotifyApi();

  try {
    await spotifyApi.play({ uris: [uri] });
  } catch (err) {
    if (err.statusCode === 401 && !isRefreshTokenRun) {
      ExtensionState.setSpotifyTokens("");
      await startPlayingUri(uri, true);
    } else {
      throw new SpotifyError("Cannot play this, maybe it's not a real track");
    }
  }
};

export const togglePlayback = async (
  isRefreshTokenRun = false
): Promise<any> => {
  const spotifyApi = await getSpotifyApi();

  try {
    const playback = await spotifyApi.getMyCurrentPlayingTrack();
    if (playback.body.is_playing) {
      await spotifyApi.pause();
    } else {
      await spotifyApi.play();
    }
    playback.body.is_playing = !playback.body.is_playing;
    return formatCurrentlyPlaying(playback.body);
  } catch (err) {
    if (err.statusCode === 401 && !isRefreshTokenRun) {
      ExtensionState.setSpotifyTokens("");
      return await togglePlayback(true);
    }
  }
};

export class SpotifyError extends Error {}
