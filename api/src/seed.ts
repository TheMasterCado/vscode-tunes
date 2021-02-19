import { User } from "./entities/User";
import { v4 as uuid } from "uuid";

export const runSeed = async () => {
  await User.create({
    uuid: uuid(),
    spotifyId: "seed123",
    name: "Jean-Bob Lehoux",
    currentlyPlayingName: "A song very good - LOL",
    currentlyPlayingUri: "spotify:temptemptemp",
    currentlyPlayingAt: new Date(),
  }).save();
  await User.create({
    uuid: uuid(),
    spotifyId: "seed321",
    name: "IDontListenToMusicBitch",
  }).save();
  await User.create({
    uuid: uuid(),
    spotifyId: "seed441",
    name: "Joel Borat",
    currentlyPlayingName: "Cute song - Cute artist",
    currentlyPlayingUri: "spotify:temptemptemp",
    currentlyPlayingAt: new Date(),
  }).save();
};
