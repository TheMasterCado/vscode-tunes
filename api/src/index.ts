import "reflect-metadata";
require("dotenv-safe").config();
import express from "express";
import { join } from "path";
import { createConnection } from "typeorm";
import { __prod__ } from "./constants";
import passport from "passport";
import { Strategy as SpotifyStrategy } from "passport-spotify";
import { User } from "./entities/User";
import jwt from "jsonwebtoken";
import cors from "cors";
import querystring from "querystring";
import { v4 as uuid } from "uuid";
import axios from "axios";
import { validateAuthorizationHeader } from "./helpers";

const main = async () => {
  // connect to db
  await createConnection({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "password",
    database: "vscode-tunes",
    entities: [join(__dirname, "./entities/*.*")],
    logging: !__prod__,
    synchronize: !__prod__,
  });

  const app = express();
  passport.serializeUser((user: any, done) => {
    done(null, user.accessToken);
  });
  app.use(express.json());
  app.use(cors({ origin: "*" }));
  app.use(passport.initialize());

  // setup passport for login with spotify
  passport.use(
    new SpotifyStrategy(
      {
        clientID: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        callbackURL: "http://localhost:3002/auth/spotify/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        let user = await User.findOne({ where: { spotifyId: profile.id } });
        if (user) {
          user.name = profile.displayName;
          await user.save();
        } else {
          user = await User.create({
            uuid: uuid(),
            name: profile.displayName,
            spotifyId: profile.id,
          }).save();
        }
        return done(null, {
          accessToken: jwt.sign(
            {
              userUuid: user.uuid,
            },
            process.env.ACCESS_TOKEN_SECRET,
            {
              expiresIn: "1y",
            }
          ),
          spotifyAccessToken: accessToken,
          spotifyRefreshToken: refreshToken,
        });
      }
    )
  );

  app.get("/me", async (req, res) => {
    const authHeader = req.headers.authorization;
    const user = await validateAuthorizationHeader(authHeader);
    if (!user) {
      res.sendStatus(401);
      return;
    }

    res.send({ user });
  });
  app.patch("/me", async (req, res) => {
    const authHeader = req.headers.authorization;
    const user = await validateAuthorizationHeader(authHeader);
    if (!user) {
      res.sendStatus(401);
      return;
    }

    const currentlyPlaying = req.body.currently_playing;
    if (currentlyPlaying !== undefined) {
      user.currentlyPlayingName = currentlyPlaying.name;
      user.currentlyPlayingUri = currentlyPlaying.uri;
      await user.save();
    }

    res.send({ user });
  });
  app.get("/users", async (req, res) => {
    const authHeader = req.headers.authorization;
    const user = await validateAuthorizationHeader(authHeader);
    if (!user) {
      res.sendStatus(401);
      return;
    }

    const users = await User.find();
    res.send({ users });
  });
  app.get(
    "/auth/spotify",
    passport.authenticate("spotify", {
      scope: [
        "user-read-email",
        "user-read-private",
        "user-read-currently-playing",
        "user-modify-playback-state",
      ],
      session: false,
    })
  );
  app.get(
    "/auth/spotify/callback",
    passport.authenticate("spotify", { session: false }),
    (req: any, res) => {
      res.redirect(
        `http://localhost:53698/auth/${req.user.accessToken}:${req.user.spotifyAccessToken}:${req.user.spotifyRefreshToken}`
      );
    }
  );
  app.post("/auth/spotify/refresh", async (req, res) => {
    const refreshToken = req.body.refresh_token;
    const body = querystring.stringify({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.SPOTIFY_CLIENT_ID,
      client_secret: process.env.SPOTIFY_CLIENT_SECRET,
    });
    try {
      const response = await axios.post(
        "https://accounts.spotify.com/api/token",
        body,
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
      res.send(response.data);
    } catch (err) {
      res.sendStatus(401);
    }
  });

  app.listen(3002, () => {
    console.log("listening on localhost:3002");
  });
};

main();
