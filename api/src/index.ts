import "reflect-metadata";
require("dotenv-safe").config();
import express from "express";
import { join } from "path";
import { existsSync } from "fs";
import { createConnection, getRepository } from "typeorm";
import { __prod__ } from "./constants";
import passport from "passport";
import { Strategy as SpotifyStrategy } from "passport-spotify";
import { User } from "./entities/User";
import jwt from "jsonwebtoken";
import cors from "cors";
import querystring from "querystring";
import { v4 as uuid } from "uuid";
import axios from "axios";
import { isUserActive, mapUser, validateAuthorizationHeader } from "./helpers";
import { Follower } from "./entities/Follower";
import { runSeed } from "./seed";
const expressWs = require("express-ws");
import {
  Instance as ExpressWsInstance,
  Application as ExpressWsApplication,
} from "express-ws";
import WebSocket from "ws";

const main = async () => {
  // connect to db
  await createConnection({
    type: "mysql",
    host: process.env.DB_HOST || "localhost",
    port: 3306,
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "password",
    database: "vscode-tunes",
    entities: [join(__dirname, "./entities/*.*")],
    logging: !__prod__,
    synchronize: !__prod__,
  });
  // await runSeed();
  const _app = express();
  const appWs: ExpressWsInstance = expressWs(_app);
  // Fix type for ws app
  const app = (_app as unknown) as ExpressWsApplication;
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
        callbackURL: `${process.env.API_BASE_URL}/auth/spotify/callback`,
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
      user.currentlyPlayingName = currentlyPlaying?.name;
      user.currentlyPlayingUri = currentlyPlaying?.uri;
      user.currentlyPlayingAt = new Date();
      await user.save();
      appWs.getWss().clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              userUuid: user.uuid,
              currentlyPlayingName: user.currentlyPlayingName,
              currentlyPlayingUri: user.currentlyPlayingUri,
              currentlyPlayingAt: user.currentlyPlayingAt,
            })
          );
        }
      });
    }
    res.send({ user });
  });
  app.put("/me/followed", async (req, res) => {
    const authHeader = req.headers.authorization;
    const user = await validateAuthorizationHeader(authHeader);
    if (!user) {
      res.sendStatus(401);
      return;
    }

    const userUuid = req.body.user_uuid;
    if (!userUuid) {
      res.sendStatus(422);
      return;
    }
    const followed = await User.findOne({ where: { uuid: userUuid } });
    if (!followed) {
      res.sendStatus(422);
      return;
    }

    await Follower.create({
      user: user,
      followed: followed,
      followedAt: new Date(),
    }).save();

    res.send({ followed });
  });
  app.delete("/me/followed/:userUuid", async (req, res) => {
    const authHeader = req.headers.authorization;
    const user = await validateAuthorizationHeader(authHeader);
    if (!user) {
      res.sendStatus(401);
      return;
    }

    const userUuid = req.params.userUuid;
    if (!userUuid) {
      res.sendStatus(404);
      return;
    }
    const followerInstance = await getRepository(Follower)
      .createQueryBuilder("follower")
      .innerJoinAndSelect("follower.followed", "followed")
      .where("followed.uuid = :uuid", { uuid: userUuid })
      .getOne();
    if (!followerInstance) {
      res.sendStatus(404);
      return;
    }

    await followerInstance.remove();

    res.send({ followed: followerInstance.followed });
  });
  app.get("/users", async (req, res) => {
    const authHeader = req.headers.authorization;
    const user = await validateAuthorizationHeader(authHeader);
    if (!user) {
      res.sendStatus(401);
      return;
    }

    const view = req.query.view || "everyone";
    const searchQuery = req.query.q?.toString() || "";
    const limit = req.query.limit || 200;
    const offset = req.query.offset || 0;

    let users;
    let query;
    switch (view) {
      case "everyone":
        const followedIds = (
          await getRepository(Follower)
            .createQueryBuilder("follower")
            .select("follower.followedId", "followedId")
            .where("follower.userId = :userId", { userId: user.id })
            .getRawMany()
        ).map((f) => f.followedId);
        query = getRepository(User).createQueryBuilder("user");
        if (searchQuery.length > 0) {
          query = query.where("user.name LIKE :searchQuery", {
            searchQuery: `%${searchQuery}%`,
          });
        }
        users = (
          await query
            .orderBy("user.currentlyPlayingAt", "DESC")
            .take(+limit)
            .skip(+offset)
            .getMany()
        ).map((u) => ({
          ...mapUser(u),
          followed: followedIds.includes(u.id),
        }));
        break;
      case "followed":
        query = getRepository(Follower)
          .createQueryBuilder("follower")
          .innerJoinAndSelect("follower.followed", "followed")
          .where("follower.userId = :userId", { userId: user.id });
        if (searchQuery.length > 0) {
          query = query.where("followed.name LIKE :searchQuery", {
            searchQuery: `%${searchQuery}%`,
          });
        }
        users = (
          await query
            .orderBy("followed.currentlyPlayingAt", "DESC")
            .take(+limit)
            .skip(+offset)
            .getMany()
        ).map((f) => ({
          ...mapUser(f.followed),
          followed: true,
        }));
        break;
    }
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

  // public
  app.get("/public/:file", (req, res) => {
    const filename = req.params.file.replace(new RegExp("\\.\\."), "");
    const filepath = join(__dirname, `../public/${filename}`);
    try {
      if (existsSync(filepath)) {
        res.sendFile(filepath);
      } else {
        res.sendStatus(404);
      }
    } catch (err) {
      res.sendStatus(404);
    }
  });

  // .well-known
  app.get("/.well-known/:file", (req, res) => {
    const filename = req.params.file.replace(new RegExp("\\.\\."), "");
    const filepath = join(__dirname, `../.well-known/${filename}`);
    try {
      if (existsSync(filepath)) {
        res.sendFile(filepath);
      } else {
        res.sendStatus(404);
      }
    } catch (err) {
      res.sendStatus(404);
    }
  });

  // views

  app.get("/", (req, res) => {
    res.sendFile(join(__dirname, "../views/index.html"));
  });

  app.get("/auth-over", (req, res) => {
    res.sendFile(join(__dirname, "../views/auth-over.html"));
  });

  //ws

  app.ws("/realtime", async (ws, req) => {});

  app.listen(3002, () => {
    console.log("listening on localhost:3002");
  });
};

main();
