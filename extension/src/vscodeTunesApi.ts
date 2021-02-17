import { ExtensionState } from "./ExtensionState";

import axios from "axios";
import { apiBaseUrl } from "./constants";

export const refreshSpotifyAccessToken = async () => {
  const refreshToken = ExtensionState.getSpotifyRefreshToken();
  if (!refreshToken) {
    throw new Error("Could not refresh Spotify access token");
  }
  const response = await axios.post(
    `${apiBaseUrl}/auth/spotify/refresh`,
    {
      refresh_token: refreshToken,
    },
    { headers: { "Content-Type": "application/json" } }
  );
  const newAccessToken: string = response.data.access_token;
  const newRefreshToken: string | undefined = response.data.refresh_token;
  if (!newAccessToken) {
    throw new Error("Could not refresh Spotify access token");
  }

  await ExtensionState.setSpotifyTokens(
    newAccessToken,
    newRefreshToken || refreshToken
  );
  return newAccessToken;
};

export const updateCurrentlyPlaying = async (currentlyPlaying: any) => {
  const accessToken = ExtensionState.getAccessToken();
  if (!accessToken) {
    throw new Error("Not logged in");
  }

  const response = await axios.patch(
    `${apiBaseUrl}/me`,
    {
      currently_playing: currentlyPlaying,
    },
    {
      headers: {
        authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );
  if (response.status !== 200) {
    throw new Error("Could not update currently playing");
  }
};
