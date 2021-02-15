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
import { v4 as uuid } from "uuid";

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
              spotifyAccessToken: accessToken,
              spotifyRefreshToken: refreshToken,
            },
            process.env.ACCESS_TOKEN_SECRET,
            {
              expiresIn: "1y",
            }
          ),
        });
      }
    )
  );

  app.get("/", (_req, res) => {
    res.send("hello");
  });
  app.get(
    "/auth/spotify",
    passport.authenticate("spotify", { session: false })
  );
  app.get(
    "/auth/spotify/callback",
    passport.authenticate("spotify", { session: false }),
    (req: any, res) => {
      res.redirect(`http://localhost:53698/auth/${req.user.accessToken}`);
    }
  );

  app.listen(3002, () => {
    console.log("listening on localhost:3002");
  });
};

main();
